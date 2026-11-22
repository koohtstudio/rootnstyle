#!/bin/bash
# Applies neon/migrations and neon/seed.sql to a throwaway local Postgres and checks the key guarantees.
# Needs initdb, pg_ctl and psql on PATH. Run from the repo root: bash scripts/verify-neon-sql.sh
S="$(mktemp -d)"
rm -rf $S/pg && initdb -D $S/pg -U postgres -A trust >/dev/null 2>&1 && pg_ctl -D $S/pg -o "-p 5544 -c unix_socket_directories=''" -l $S/pg.log start >/dev/null 2>&1; sleep 2
P() { psql -h 127.0.0.1 -p 5544 -U postgres -v ON_ERROR_STOP=1 -q "$@"; }
P <<'SQL'
create role anonymous nologin; create role authenticated nologin; create role app_service nologin bypassrls;
create schema auth;
create function auth.user_id() returns text language sql stable as $$ select nullif(current_setting('request.user_id', true), '') $$;
SQL
echo "--- migrate"; P -f neon/migrations/0001_init.sql 2>&1 | tail -10
echo "--- seed x2"; P -f neon/seed.sql 2>&1 | tail -3; P -f neon/seed.sql 2>&1 | tail -3
echo "--- checks"; P -t <<'SQL' 2>&1
select count(*) as services from services;
insert into bookings (service_id,start_at,duration_min,name,phone,status) values ('haircuts','2026-12-01 14:00',60,'A One','9055550101','confirmed');
insert into bookings (service_id,start_at,duration_min,name,phone,status) values ('facials','2026-12-01 14:30',60,'B Two','9055550102','new');
do $$ begin
  begin insert into bookings (service_id,start_at,duration_min,name,phone,status) values ('facials','2026-12-01 14:30',30,'C Three','9055550103','confirmed'); raise exception 'CLASH NOT BLOCKED'; exception when exclusion_violation then raise notice 'clash blocked OK'; end;
end $$;
do $$ begin
  begin update bookings set status='confirmed' where name='B Two'; raise exception 'CONFIRM CLASH NOT BLOCKED'; exception when exclusion_violation then raise notice 'confirm clash blocked OK'; end;
end $$;
SQL
echo "--- anonymous"; P -t <<'SQL' 2>&1
set role anonymous;
select count(*) as public_services from public_services;
select count(*) as busy from busy_intervals;
SQL
P -t -c "set role anonymous; select * from bookings;" 2>&1 | head -2
P -t -c "set role anonymous; insert into bookings (service_id,start_at,duration_min,name,phone) values ('haircuts','2026-12-02 10:00',60,'Anon','9055550109');" 2>&1 | head -2
echo "--- staff"; P -t <<'SQL' 2>&1
insert into profiles (auth_user_id, display_name, role) values ('u-owner','Owner','owner'),('u-desk','Desk','frontdesk');
set role authenticated; set request.user_id = 'u-desk';
select count(*) as desk_sees_bookings from bookings;
update services set price = 10 where id='waxing' returning price;
set request.user_id = 'u-owner';
update services set price = 12 where id='waxing' returning price;
SQL
P -t -c "select count(*) as audit_rows from audit_log;"
P -t -c "set role authenticated; set request.user_id='u-owner'; update audit_log set actor='x';" 2>&1 | head -2
P -t -c "set role app_service; insert into bookings (service_id,start_at,duration_min,name,phone) values ('haircuts','2026-12-02 10:00',60,'Server','9055550110') returning true;" 2>&1 | head -3
pg_ctl -D $S/pg stop >/dev/null 2>&1; echo stopped
