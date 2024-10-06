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
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from 'url';
import "acts-util-core";
import { interactionsRouter } from "./oidc/interactions.js";
import { Factory, GlobalInjector } from "acts-util-node";
import { allowedOrigins, port } from "./config.js";
import { OIDCProviderService } from "./oidc/OIDCProviderService.js";

async function BootstrapServer()
{
    const requestHandlerChain = Factory.CreateRequestHandlerChain();
    requestHandlerChain.AddCORSHandler(allowedOrigins);
    requestHandlerChain.AddBodyParser();

    /*await import("./__http_registry.js");

    const openAPIDef: OpenAPI.Root = (await import("../dist/openapi.json", { assert: { type: "json" }, })).default as any;
    const backendStructure: any = (await import("../dist/openapi-structure.json", { assert: { type: "json" }, })).default;
    requestHandlerChain.AddRequestHandler(new HTTP.RouterRequestHandler(openAPIDef, backendStructure, APIRegistry.endPointTargets, false));*/

    const app = requestHandlerChain.requestListener as express.Express;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const ejs = (await import("ejs")).default as any;
    app.set('view engine', 'ejs');
    app.engine('ejs', ejs.__express);
    app.set('views', path.join(__dirname, 'views'));

    requestHandlerChain.AddThirdPartyHandler(interactionsRouter);
    requestHandlerChain.AddThirdPartyHandler(GlobalInjector.Resolve(OIDCProviderService).provider.callback());

    const server = http.createServer(requestHandlerChain.requestListener);

    server.listen(port, () => {
        console.log('oidc-provider listening on port ' + port + ', check http://localhost:' + port + '/.well-known/openid-configuration');
    });

    process.on('SIGINT', function()
    {
        console.log("Shutting server down...");
        server.close();
    });
}

BootstrapServer();