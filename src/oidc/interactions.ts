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
import { GlobalInjector } from "acts-util-node";
import express, { urlencoded } from "express";
import { OIDCProviderService } from "./OIDCProviderService.js";
import { errors } from "oidc-provider";
import { UserAccountsController } from "../data-access/UserAccountsController.js";

export const interactionsRouter = express.Router();

function setNoCache(req: express.Request, res: express.Response, next: express.NextFunction)
{
    res.set('cache-control', 'no-store');
    next();
}

interactionsRouter.use((req, res, next) => {
    const orig = res.render;
    const app = res.app;

    //wrap view in _layout.ejs    
    res.render = (view, locals) =>
    {
        app.render(view, locals, (err, html) =>
        {
            if (err) throw err;

            orig.call(res, '_layout', {
                ...locals,
                body: html,
            } as any);
      });
    };
    next();
  });

interactionsRouter.get('/interaction/:uid', setNoCache, async function(req: express.Request, res: express.Response, next: express.NextFunction)
{
    const provider = GlobalInjector.Resolve(OIDCProviderService).provider;
    const interactionDetails = await provider.interactionDetails(req, res);
    const params = interactionDetails.params as any;

    const client = await provider.Client.find(params.client_id);
    
    switch (interactionDetails.prompt.name)
    {
        case 'login':
        {
            return res.render('login', {
                uid: interactionDetails.uid,
                title: 'Sign-in',
                client,
            });
        }
        default:
            console.log("HERE", interactionDetails.prompt);
    }
});

interactionsRouter.post('/interaction/:uid/login', setNoCache, urlencoded({ extended: false }), async (req, res, next) =>
{
    const provider = GlobalInjector.Resolve(OIDCProviderService).provider;
    const interactionDetails = await provider.interactionDetails(req, res);

    const userAccountsController = GlobalInjector.Resolve(UserAccountsController);
    const account = userAccountsController.Query(req.body.login);

    const result = {
        login: {
            accountId: account!.accountId,
        },
    };

    console.log(result);    
    await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
});


interactionsRouter.use(function(error: any, req: express.Request, res: express.Response, next: express.NextFunction)
{
    if (error instanceof errors.SessionNotFound)
    {
        // handle interaction expired / session not found error
    }
    next(error);
});