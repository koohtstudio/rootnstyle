"use client";

import { useMemo } from "react";
import { deriveClients } from "@/lib/domain/clients";
import type { Booking, Client, GalleryPhoto, Hours, SentMessage, Service, ServiceCategory, Settings } from "@/lib/domain/schemas";
import type { DayAvailability, Slot } from "@/lib/domain/slots";
import type { DateKey } from "@/lib/domain/time";
import { PUBLIC_SEED } from "@/lib/mock/seed";
import { getRepo } from "@/lib/repo";
import type { BookingFilter } from "@/lib/repo/types";
import { useQuery, type QueryResult } from "./useQuery";

// ----- public site (renders real content on the server, then follows the store) -----

export const useCategories = (): QueryResult<ServiceCategory[]> =>
  useQuery((r) => r.services.listCategories(), [], { initial: PUBLIC_SEED.categories });

/** Visible services only. */
export const usePublicServices = (): QueryResult<Service[]> =>
  useQuery((r) => r.services.list(), [], { initial: PUBLIC_SEED.services });

export const usePublicGallery = (): QueryResult<GalleryPhoto[]> =>
  useQuery((r) => r.gallery.list(), [], { initial: PUBLIC_SEED.gallery });

export const useSettings = (): QueryResult<Settings> =>
  useQuery((r) => r.settings.get(), [], { initial: PUBLIC_SEED.settings });

export const useHours = (): QueryResult<Hours[]> =>
  useQuery((r) => r.settings.getHours(), [], { initial: PUBLIC_SEED.hours });

// ----- availability (public, no personal data) -----

export const useOpenDays = (serviceId: string | null, enabled = true): QueryResult<DayAvailability[]> =>
  useQuery((r) => r.bookings.openDays(serviceId), [serviceId], { enabled });

export const useSlots = (serviceId: string | null, dateKey: DateKey | null): QueryResult<Slot[]> =>
  useQuery((r) => r.bookings.slots(serviceId, dateKey as DateKey), [serviceId, dateKey], { enabled: !!dateKey });

export const useNextOpenSlot = (serviceId: string | null): QueryResult<Slot | null> =>
  useQuery((r) => r.bookings.nextOpenSlot(serviceId), [serviceId]);

// ----- admin -----

export const useAllServices = (): QueryResult<Service[]> =>
  useQuery((r) => r.services.list({ includeHidden: true }), []);

export const useAllGallery = (): QueryResult<GalleryPhoto[]> =>
  useQuery((r) => r.gallery.list({ includeHidden: true }), []);

export const useBookings = (filter?: BookingFilter): QueryResult<Booking[]> => {
  const key = JSON.stringify(filter ?? {});
  return useQuery((r) => r.bookings.list(filter), [key]);
};

export const useClients = (): QueryResult<Client[]> => useQuery((r) => r.clients.list(), []);

export const useSentLog = (): QueryResult<SentMessage[]> => useQuery((r) => r.sent.list(), []);

/** Derived locally from a bookings result so the Clients page and detail panels share one fetch. */
export function useClientsFrom(bookings: Booking[] | undefined, todayKey: string): Client[] | undefined {
  return useMemo(() => (bookings ? deriveClients(bookings, todayKey) : undefined), [bookings, todayKey]);
}

/** The repo, for calling actions (confirm, update, create). Reads should go through the hooks above. */
export const useRepo = () => getRepo();
