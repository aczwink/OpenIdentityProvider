/**
 * OpenIdentityProvider
 * Copyright (C) 2024 Amir Czwink (amir130@hotmail.de)
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * */

import { APIResponseHandler, RouteSetup } from "acfrontendex";
import { APIService } from "../services/APIService";
import { PKI_Certificate } from "../../dist/api";
import { OpenAPISchema } from "../api-info";
import { FileDownloadService, Use } from "acfrontend";

const createCertRoute: RouteSetup<{}, { commonName: string; }> = {
    content: {
        type: "create",
        call: (_, data) => Use(APIService).pki.post({ commonName: data.commonName }),
        schema: {
            additionalProperties: false,
            properties: {
                commonName: {
                    type: "string"
                },
            },
            required: ["commonName"],
            type: "object",
        }
    },
    displayText: "Create certificate",
    icon: "plus",
    routingKey: "create",
};

export const pkiRoute: RouteSetup<{}, PKI_Certificate> = {
    content: {
        type: "list",
        actions: [createCertRoute],
        boundActions: [
            {
                type: "custom",
                action: async (_, cert) => {
                    const response = await Use(APIService).pki._any_.get(cert.name);
                    const result = await Use(APIResponseHandler).ExtractDataFromResponseOrShowErrorMessageOnError(response);
                    if(result.ok)
                    {
                        const fds = Use(FileDownloadService);
                        
                        fds.DownloadBlobAsFile(new Blob([result.value.privateKey], { type: "text/plain" }), "private.key");
                        fds.DownloadBlobAsFile(new Blob([result.value.publicKey], { type: "text/plain" }), "public.crt");
                    }
                },
                icon: "download"
            }
        ],
        requestObjects: () => Use(APIService).pki.get(),
        schema: OpenAPISchema("PKI_Certificate")
    },
    displayText: "PKI",
    icon: "pass",
    requiredScopes: ["admin"],
    routingKey: "pki",
};