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
import { OIDCProviderService } from "./OIDCProviderService";
import { errors } from "oidc-provider";
import { UserAccountsController } from "../data-access/UserAccountsController";
import { ScopeEvaluationService } from "../services/ScopeEvaluationService";

export const interactionsRouter = express.Router();

function setNoCache(req: express.Request, res: express.Response, next: express.NextFunction)
{
    res.set('cache-control', 'no-store');
    next();
}
const parseURLEncodedBody = urlencoded({ extended: false });

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
    let interactionDetails;
    try
    {
        interactionDetails = await provider.interactionDetails(req, res);
    }
    catch(err)
    {
        return next(err);
    }

    const params = interactionDetails.params as any;

    const client = (await provider.Client.find(params.client_id))!;
    
    switch (interactionDetails.prompt.name)
    {
        case "consent":
        {
            const accountId = interactionDetails.session?.accountId!;
            const scope = (interactionDetails.params.scope as string);

            const isValid = await GlobalInjector.Resolve(ScopeEvaluationService).IsScopeRequestValid(client.clientId, accountId, scope);
            if(!isValid)
            {
                const result = {
                    error: 'access_denied',
                    error_description: 'Insufficient permissions: scope out of reach for this Account',
                };
                await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
                return;
            }

            return res.render('interaction', {
                client,
                uid: interactionDetails.uid,
                title: 'Authorize',
                details: interactionDetails.prompt.details,
                params: interactionDetails.params
              });
        }
        case 'login':
        {
            return res.render('login', {
                uid: interactionDetails.uid,
                title: 'Sign-into application: ' + client.clientName,
                client,
            });
        }
        default:
            console.log("HERE", interactionDetails.prompt);
    }
});

interactionsRouter.post('/interaction/:uid/login', setNoCache, parseURLEncodedBody, async (req, res, next) =>
{
    const provider = GlobalInjector.Resolve(OIDCProviderService).provider;
    const interactionDetails = await provider.interactionDetails(req, res);

    const userAccountsController = GlobalInjector.Resolve(UserAccountsController);
    const account = await userAccountsController.QueryByExternalId(req.body.login);

    const result = {
        login: {
            accountId: account!.eMailAddress,
        },
    };

    await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
});

interactionsRouter.post('/interaction/:uid/confirm', setNoCache, parseURLEncodedBody, async (req, res, next) =>
{
    const provider = GlobalInjector.Resolve(OIDCProviderService).provider;
    const interactionDetails = await provider.interactionDetails(req, res);

    const accountId = interactionDetails.session?.accountId;
    const params = interactionDetails.params;
    const details = interactionDetails.prompt.details;

    let { grantId } = interactionDetails;    
    let grant;
    
    if (grantId)
    {
        // we'll be modifying existing grant in existing session
        grant = await provider.Grant.find(grantId);
        if(grant === undefined)
            throw new Error("TODO: implement me");
    }
    else
    {
        // we're establishing a new grant
        grant = new provider.Grant({
            accountId,
            clientId: params.client_id as any,
        });
    }

    if (details.missingOIDCScope)
    {
        grant.addOIDCScope((details.missingOIDCScope as any).join(' '));
    }
    if (details.missingOIDCClaims)
    {
        grant.addOIDCClaims(details.missingOIDCClaims as any);
    }
    if (details.missingResourceScopes)
    {
        for (const [indicator, scopes] of Object.entries(details.missingResourceScopes))
        {
            grant.addResourceScope(indicator, scopes.join(' '));
        }
    }
    
    grantId = await grant.save();
    
    const consent: any = {};
    if (!interactionDetails.grantId)
    {
        consent.grantId = grantId;
    }

    const result = { consent };
    await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
});


interactionsRouter.use(function(error: any, req: express.Request, res: express.Response, next: express.NextFunction)
{
    if (error instanceof errors.SessionNotFound)
    {
        // handle interaction expired / session not found error
    }
    next(error);
});