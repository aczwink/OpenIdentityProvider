/**
 * OpenIdentityProvider
 * Copyright (C) 2024-2025 Amir Czwink (amir130@hotmail.de)
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
import fs from "fs";
import path from "path";
import { JsonWebKey } from "crypto";
import { CreateTempDir, Injectable } from "acts-util-node";
import { JWK } from "node-jose";
import { PKI_Type, PKIController } from "../data-access/PKIController";
import { CommandExecutor } from "./CommandExecutor";
import * as ENV from "../env";

interface Request
{
    commonName: string;
    crtPath: string;
    extPath: string;
    keyPath: string;
    reqPath: string;
    tmpdir: string;
}

@Injectable
export class PKIManager
{
    constructor(private pkiController: PKIController, private commandExecutor: CommandExecutor)
    {
    }

    //Public methods
    public async CreateServerCert(commonName: string)
    {
        const req = await this.CreateRequest(commonName);
        const serial = await this.SignRequest(req);
        
        const key = await fs.promises.readFile(req.keyPath, "utf-8");
        const crt = await fs.promises.readFile(req.crtPath, "utf-8");
        await this.StoreKeyPair(commonName, PKI_Type.Server, serial, key, crt);

        await fs.promises.rm(req.tmpdir, { recursive: true });
    }

    public async LoadCACert()
    {
        const ca = await this.ReadCA();

        return ca.publicKey;
    }

    public async LoadServiceKeyPair()
    {
        const certName = ENV.CONFIG_OIDC.domain;
        const oidp = await this.ReadKeyPair(certName);
        if(oidp === undefined)
        {
            await this.CreateServerCert(certName);
            return (await this.ReadKeyPair(certName))!;
        }

        return oidp;
    }

    public async LoadSigningKeys(): Promise<{ keys: [JsonWebKey] }>
    {
        const jwks = await this.pkiController.Query("jwks");
        if(jwks === undefined)
        {
            const signingKey = await this.GenerateSigningKey();
            await this.pkiController.Set("jwks", PKI_Type.Special, "jwks", Buffer.from(JSON.stringify(signingKey)));

            return signingKey as any;
        }

        return JSON.parse(jwks.toString("utf-8")) as any;
    }

    public async ReadKeyPair(name: string)
    {
        const keyPair = await this.pkiController.Query(name);
        if(keyPair !== undefined)
        {
            return JSON.parse(keyPair.toString("utf-8")) as { privateKey: string, publicKey: string };
        }
    }

    //Private methods
    private async CreateRequest(commonName: string): Promise<Request>
    {
        const tmpdir = await CreateTempDir();
        const keyPath = path.join(tmpdir, "key");
        const reqPath = path.join(tmpdir, "req");

        await this.commandExecutor.Exec([
            "openssl", "req", "-utf8", "-new", "-newkey", "rsa:4096",
            "-keyout", keyPath,
            "-out", reqPath,
            "-noenc",
            "-batch",
            "-subj", "/CN=" + commonName + "/O=OIDP/C=US/ST=Oregon"
        ]);

        return {
            commonName,
            tmpdir,
            keyPath,
            reqPath,
            crtPath: path.join(tmpdir, "crt"),
            extPath: path.join(tmpdir, "ext")
        };
    }

    private async GenerateCA()
    {
        const tmpdir = await CreateTempDir();
        const caKeyPath = path.join(tmpdir, "ca.key");
        const crtPath = path.join(tmpdir, "ca.crt");
        
        await this.commandExecutor.Exec([
            "openssl", "genpkey", "-algorithm", "rsa",
            "-pkeyopt", "rsa_keygen_bits:4096",
            "-out", caKeyPath
        ]);

        const commonName = ENV.IdentityProviderName;
        await this.commandExecutor.Exec([
            "openssl", "req", "-batch", "-utf8", "-new",
            "-key", caKeyPath, "-keyout", caKeyPath,
            "-out", crtPath,
            "-x509",
            "-days", "3650",
            "-sha256",
            "-noenc",
            "-subj", "/CN=" + commonName + "/O=OIDP/C=US/ST=Oregon"
        ]);

        const key = await fs.promises.readFile(caKeyPath, "utf-8");
        const crt = await fs.promises.readFile(crtPath, "utf-8");

        await this.StoreKeyPair("ca", PKI_Type.Special, "ca", key, crt);

        await fs.promises.rm(tmpdir, { recursive: true });

        return {
            key,
            crt
        };
    }

    private async GenerateSigningKey()
    {
        const keyStore = JWK.createKeyStore();
        
        await keyStore.generate('EC', "P-256", { alg: 'ES256', use: 'sig' });
        return keyStore.toJSON(true);
    }

    private async GenerateUniqueSerial(): Promise<string>
    {
        const stdout = await this.commandExecutor.Exec([
            "openssl", "rand", "-hex", "16"
        ]);
        const serial = stdout.trim();
        const exists = await this.pkiController.DoesSerialExist(serial);
        if(exists)
            return await this.GenerateUniqueSerial();
        return serial;
    }

    private async ProvideCA(dirPath: string)
    {
        const ca = await this.ReadCA();

        const keyPath = path.join(dirPath, "ca.key");
        const certPath = path.join(dirPath, "ca.crt");
        
        await fs.promises.writeFile(keyPath, ca.privateKey, "utf-8");
        await fs.promises.writeFile(certPath, ca.publicKey, "utf-8");
        
        return {
            keyPath,
            certPath
        };
    }

    private async ReadCA()
    {
        const ca = await this.ReadKeyPair("ca");
        if(ca === undefined)
        {
            const ca = await this.GenerateCA();
            return {
                privateKey: ca.key,
                publicKey: ca.crt
            };
        }

        return ca;
    }

    private async SignRequest(request: Request)
    {
        const extData = `
        # X509 extensions for a server

        basicConstraints = CA:FALSE
        subjectKeyIdentifier = hash
        authorityKeyIdentifier = keyid,issuer:always
        extendedKeyUsage = serverAuth
        keyUsage = digitalSignature,keyEncipherment
        subjectAltName = DNS:${request.commonName}
        `;
        await fs.promises.writeFile(request.extPath, extData, "utf-8");

        const ca = await this.ProvideCA(request.tmpdir);

        await fs.promises.mkdir(path.join(request.tmpdir, "demoCA"));
        await fs.promises.writeFile(path.join(request.tmpdir, "demoCA", "index.txt"), "");

        const serialPath = path.join(request.tmpdir, "demoCA", "serial");
        const serial = await this.GenerateUniqueSerial();
        await fs.promises.writeFile(serialPath, serial);

        await this.commandExecutor.Exec([
            "openssl", "ca", "-utf8", "-batch",
            "-keyfile", ca.keyPath,
            "-cert", ca.certPath,
            "-in", request.reqPath, "-out", request.crtPath,
            "-outdir", request.tmpdir,
            "-extfile", request.extPath,
            //"-preserveDN",
            "-notext",
            "-days", "825",
        ], request.tmpdir);

        return serial;
    }

    private async StoreKeyPair(name: string, type: PKI_Type, serial: string, privateKey: string, publicKey: string)
    {
        await this.pkiController.Set(name, type, serial, Buffer.from(JSON.stringify({privateKey, publicKey})));
    }
}