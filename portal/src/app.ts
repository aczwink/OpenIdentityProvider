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
import { BootstrapApp, CreateOAuth2RedirectURIs } from "acfrontendex";
import { usersRoute } from "./routes/users";
import { userGroupsRoutes } from "./routes/groups";
import { appRegistrationsRoutes } from "./routes/app-registrations";
import { RegisterCustomFormats } from "./presentation/custom-formats";
import { devicesRoute } from "./routes/devices";

import openAPIRoot from "../../oidp/dist/openapi.json";
import { OpenAPI } from "../../../ACTS-Util/core/dist/main";
import { dnsRoute } from "./routes/dns";
import { changeUserPassword } from "./routes/own-user";
import { domainRoute } from "./routes/domain";

RegisterCustomFormats();


BootstrapApp({
    features: {
        oAuth2: {
            authorizeEndpoint: process.env.OIDP_AUTH_ENDPOINT!,
            clientId: process.env.OIDP_CLIENTID!,
            endSessionEndpoint: process.env.OIDP_ENDSESSION_ENDPOINT!,
            flow: "authorizationCode",
            tokenEndpoint: process.env.OIDP_TOKEN_ENDPOINT!,
            ...CreateOAuth2RedirectURIs(process.env.OIDP_FRONTEND_BASEURL!),
        },

        OIDC: true,

        openAPI: openAPIRoot as OpenAPI.Root,
    },
    layout: {
        navbar: [
            [appRegistrationsRoutes, devicesRoute, userGroupsRoutes, usersRoute],
            [dnsRoute, domainRoute]
        ],
        user: [changeUserPassword]
    },
    mountPoint: document.body,
    title: "OpenIdentityProvider Portal",
    version: "0.1 beta"
});