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
import https from "https";
import path from "path";
import "acts-util-core";
import { interactionsRouter } from "./oidc/interactions";
import { Factory, GlobalInjector, HTTP } from "acts-util-node";
import { CONFIG_OIDC } from "./env";
import { OIDCProviderService } from "./oidc/OIDCProviderService";
import { OpenAPI } from 'acts-util-core';
import { APIRegistry } from 'acts-util-apilib';
import { ActiveDirectoryService } from "./services/ActiveDirectoryService";
import { PKIManager } from "./services/PKIManager";
import { CORSHandler } from "./services/CORSHandler";

async function BootstrapServer()
{
    GlobalInjector.Resolve(ActiveDirectoryService).Initialize(); //start samba AD early

    const corsHandler = GlobalInjector.Resolve(CORSHandler);

    const requestHandlerChain = Factory.CreateRequestHandlerChain();
    requestHandlerChain.AddDynamicCORSHandler(corsHandler.IsValid.bind(corsHandler));
    requestHandlerChain.AddBodyParser();

    const pki = GlobalInjector.Resolve(PKIManager);

    requestHandlerChain.AddRequestHandler(
        new HTTP.JWTVerifier(
            await pki.LoadSigningKeys(),
            "https://" + CONFIG_OIDC.domain + ":" + CONFIG_OIDC.port,
            false
        )
    );

    await import("./__http_registry");

    const openAPIDef: OpenAPI.Root = (await import("../dist/openapi.json", { assert: { type: "json" }, })).default as any;
    const backendStructure: any = (await import("../dist/openapi-structure.json", { assert: { type: "json" }, })).default;
    requestHandlerChain.AddRequestHandler(new HTTP.RouterRequestHandler(openAPIDef, backendStructure, APIRegistry.endPointTargets, false));

    const app = requestHandlerChain.requestListener as express.Express;

    const ejs = (await import("ejs")).default as any;
    app.set('view engine', 'ejs');
    app.engine('ejs', ejs.__express);
    app.set('views', path.join(__dirname, './views'));

    requestHandlerChain.AddThirdPartyHandler(interactionsRouter);
    requestHandlerChain.AddThirdPartyHandler(GlobalInjector.Resolve(OIDCProviderService).provider.callback());

    const keyPair = await pki.LoadServiceKeyPair();
    const server = https.createServer({
        key: keyPair.privateKey,
        cert: keyPair.publicKey
    }, requestHandlerChain.requestListener);

    const port = CONFIG_OIDC.port;
    server.listen(port, () => {
        console.log('oidc-provider listening on port ' + port + ', check https://' + CONFIG_OIDC.domain + ':' + port + '/.well-known/openid-configuration');
    });

    process.on('SIGINT', function()
    {
        console.log("Shutting server down...");
        server.close();
    });
}

BootstrapServer();