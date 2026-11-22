import type {
  Booking,
  BookingRequest,
  BookingStatus,
  Client,
  GalleryInput,
  GalleryPatch,
  GalleryPhoto,
  Hours,
  Role,
  SentMessage,
  SentMessageInput,
  Service,
  ServiceCategory,
  ServiceInput,
  ServicePatch,
  Session,
  Settings,
  SettingsPatch,
} from "@/lib/domain/schemas";
import type { DayAvailability, Slot } from "@/lib/domain/slots";
import type { DateKey, StartStr } from "@/lib/domain/time";

export type Unsubscribe = () => void;
export type Direction = "up" | "down";

export interface ServicesRepo {
  listCategories(): Promise<ServiceCategory[]>;
  /** Public callers get visible services only. includeHidden needs a session. */
  list(opts?: { includeHidden?: boolean }): Promise<Service[]>;
  get(id: string): Promise<Service | null>;
  /** Owner only. */
  create(input: ServiceInput): Promise<Service>;
  /** Owner only. */
  update(id: string, patch: ServicePatch): Promise<Service>;
  /** Owner only. Swaps sort order with the neighbour in the same category. */
  move(id: string, direction: Direction): Promise<void>;
}

export interface BookingFilter {
  status?: BookingStatus | BookingStatus[];
  fromDate?: DateKey;
  toDate?: DateKey;
}

export interface BookingsRepo {
  /** Admin only. The public site never receives this list. */
  list(filter?: BookingFilter): Promise<Booking[]>;
  get(id: string): Promise<Booking | null>;
  /** Public. Validates, checks the slot, writes, and queues messages. */
  create(input: BookingRequest): Promise<Booking>;
  confirm(id: string): Promise<Booking>;
  decline(id: string): Promise<Booking>;
  complete(id: string): Promise<Booking>;
  cancel(id: string): Promise<Booking>;
  move(id: string, start: StartStr): Promise<Booking>;
  suggest(id: string, start: StartStr): Promise<Booking>;
  /** Public. Slot data only, no personal details. */
  openDays(serviceId: string | null): Promise<DayAvailability[]>;
  slots(serviceId: string | null, dateKey: DateKey): Promise<Slot[]>;
  nextOpenSlot(serviceId: string | null): Promise<Slot | null>;
}

export interface ClientsRepo {
  list(): Promise<Client[]>;
}

export interface GalleryRepo {
  list(opts?: { includeHidden?: boolean }): Promise<GalleryPhoto[]>;
  add(input: GalleryInput): Promise<GalleryPhoto>;
  update(id: string, patch: GalleryPatch): Promise<GalleryPhoto>;
  move(id: string, direction: Direction): Promise<void>;
}

export interface SettingsRepo {
  get(): Promise<Settings>;
  /** Owner only. */
  update(patch: SettingsPatch): Promise<Settings>;
  getHours(): Promise<Hours[]>;
  /** Owner only. */
  setHours(hours: Hours[]): Promise<Hours[]>;
}

export interface SentRepo {
  list(): Promise<SentMessage[]>;
}

/** Sign in, sign out, current session. */
export interface AuthPort {
  login(role: Role): Promise<Session>;
  logout(): Promise<void>;
  /** Cheap synchronous snapshot. Returns the same object until the session changes. */
  getSession(): Session | null;
  subscribe(cb: () => void): Unsubscribe;
}

/** Text and email. The mock writes to the Sent log and sends nothing. */
export interface NotifyPort {
  send(message: SentMessageInput): Promise<SentMessage>;
}

export interface StoragePort {
  /** Human sentence shown next to the uploader that says where the file goes. */
  readonly note: string;
  upload(file: File): Promise<{ src: string }>;
}

export interface DemoControls {
  /** Mock only. Reseeds everything. */
  reset(): Promise<void>;
}

export interface Repo {
  mode: "mock" | "live";
  services: ServicesRepo;
  bookings: BookingsRepo;
  clients: ClientsRepo;
  gallery: GalleryRepo;
  settings: SettingsRepo;
  sent: SentRepo;
  auth: AuthPort;
  notify: NotifyPort;
  storage: StoragePort;
  demo: DemoControls;
  /** Fires after any data change, including changes made in another tab. */
  subscribe(cb: () => void): Unsubscribe;
}
