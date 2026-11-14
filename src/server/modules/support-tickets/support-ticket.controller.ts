import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  createSupportTicketMessageSchema,
  createSupportTicketSchema,
  staffCreateSupportTicketSchema,
  listSupportTicketsQuerySchema,
  updateSupportTicketStatusSchema,
} from "@/server/modules/support-tickets/support-ticket.dto";
import { supportTicketService } from "@/server/modules/support-tickets/support-ticket.service";
import { validateBody } from "@/server/pipes/validate.pipe";
import { parsePagination } from "@/server/pipes/parse-pagination.pipe";
import { getUserId, getUserRole } from "@/server/utils/request-user";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import type { ApiSuccess } from "@/shared/types/api-response.types";
import type { PaginationMeta } from "@/shared/types/pagination.types";

function ok<T>(
  data: T,
  meta?: PaginationMeta,
  status = 200,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

function getLocaleFromRequest(req: NextRequest): string {
  const maybeLocale = req.nextUrl.pathname.split("/").filter(Boolean)[0];

  return hasLocale(routing.locales, maybeLocale)
    ? maybeLocale
    : routing.defaultLocale;
}

export const supportTicketController = {
  async list(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);

    const parsed = listSupportTicketsQuerySchema.parse({
      status: searchParams.get("status") ?? undefined,
      sortDirection: searchParams.get("sortDirection") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const pagination = parsePagination(searchParams);
    const userId = getUserId(req);

    const result = await supportTicketService.listMyTickets(
      userId,
      pagination,
      {
        status: parsed.status,
        sortDirection: parsed.sortDirection,
      },
    );

    return ok(result.items, result.meta);
  },

  async listAllForStaff(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);

    const parsed = listSupportTicketsQuerySchema.parse({
      status: searchParams.get("status") ?? undefined,
      sortDirection: searchParams.get("sortDirection") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const pagination = parsePagination(searchParams);

    const result = await supportTicketService.listAllTickets(pagination, {
      status: parsed.status,
      sortDirection: parsed.sortDirection,
    });

    return ok(result.items, result.meta);
  },

  async getById(req: NextRequest, id: string): Promise<NextResponse> {
    const userId = getUserId(req);
    const role = getUserRole(req);
    const result = await supportTicketService.getTicketById(id, userId, role);
    return ok(result);
  },

  async create(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(createSupportTicketSchema, body);
    const userId = getUserId(req);
    const locale = getLocaleFromRequest(req);

    const result = await supportTicketService.createTicket(
      userId,
      input,
      locale,
    );
    return ok(result, undefined, 201);
  },

  async createByStaff(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(staffCreateSupportTicketSchema, body);
    const locale = getLocaleFromRequest(req);

    const result = await supportTicketService.createTicketByStaff(
      input,
      locale,
    );
    return ok(result, undefined, 201);
  },

  async updateStatus(req: NextRequest, id: string): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(updateSupportTicketStatusSchema, body);
    const role = getUserRole(req);
    const userId = getUserId(req);

    const result = await supportTicketService.updateTicketStatus(
      id,
      role,
      input.status,
      userId,
    );

    return ok(result);
  },

  async delete(req: NextRequest, id: string): Promise<NextResponse> {
    const role = getUserRole(req);
    await supportTicketService.deleteTicket(id, role);
    return new NextResponse(null, { status: 204 });
  },

  // Messages
  async listMessages(
    req: NextRequest,
    ticketId: string,
  ): Promise<NextResponse> {
    const userId = getUserId(req);
    const role = getUserRole(req);
    const messages = await supportTicketService.listTicketMessages(
      ticketId,
      userId,
      role,
    );
    return ok(messages);
  },

  async addMessage(req: NextRequest, ticketId: string): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(createSupportTicketMessageSchema, body);
    const userId = getUserId(req);
    const role = getUserRole(req);
    const locale = getLocaleFromRequest(req);

    const message = await supportTicketService.addTicketMessage(
      ticketId,
      userId,
      role,
      input,
      locale,
    );
    return ok(message, undefined, 201);
  },

  async deleteMessage(
    req: NextRequest,
    ticketId: string,
    messageId: string,
  ): Promise<NextResponse> {
    const userId = getUserId(req);
    const role = getUserRole(req);

    await supportTicketService.deleteTicketMessage(
      ticketId,
      messageId,
      userId,
      role,
    );
    return new NextResponse(null, { status: 204 });
  },
};
