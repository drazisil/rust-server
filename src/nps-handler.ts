// src/nps-handler.ts
// SPDX-License-Identifier: GPL-3.0-or-later
// Handles NPSMessageDTOs from the TCP server and returns response DTOs if needed.

import { NPSMessageDTO } from './server';
import { NPSMessage } from './parsers/nps';

/**
 * Handles an incoming NPSMessageDTO, processes the NPS message, and returns an optional response DTO.
 *
 * @param dto - The NPSMessageDTO received from the TCP server.
 * @returns A response NPSMessageDTO to be sent back to the client, or undefined if no response is needed.
 */
export function handleNpsMessage(dto: NPSMessageDTO): NPSMessageDTO | undefined {
    // Example: Echo the payload back if the NPS message is valid
    if (dto.nps && dto.payload) {
        // Echo the payload as a response
        return {
            id: dto.id,
            payload: dto.payload,
            nps: undefined
        };
    }
    // No response for invalid or unrecognized NPS messages
    return undefined;
}
