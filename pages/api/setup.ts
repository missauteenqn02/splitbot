import type { NextApiRequest, NextApiResponse } from 'next';
import { Sphere, getCoinIdBySymbol } from '@unicitylabs/sphere-sdk';
import { createNodeProviders } from '@unicitylabs/sphere-sdk/impl/nodejs';
import { createWalletApiProviders } from '@unicitylabs/sphere-sdk/impl/shared/wallet-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const logs: string[] = [];
    const log = (msg: string) => { console.log(msg); logs.push(msg); };

    log("Setting up testnet wallet...");
    const base = createNodeProviders({
      network: 'testnet',
      oracle: { apiKey: 'sk_ddc3cfcc001e4a28ac3fad7407f99590' },
    });

    const providers = createWalletApiProviders(base, {
      baseUrl: 'https://wallet-api.unicity.network',
      network: 'testnet2',
      deviceId: 'splitbot-setup',
    });

    const { sphere, generatedMnemonic } = await Sphere.init({
      ...providers,
      network: 'testnet',
      autoGenerate: true,
    });

    if (generatedMnemonic) {
      log("NEW MNEMONIC GENERATED: " + generatedMnemonic);
    }

    const identity = sphere.identity;
    log("Wallet Address: " + identity?.directAddress);

    const coinId = getCoinIdBySymbol('UCT');
    if (coinId) {
      log("Minting 10000 UCT for the bot...");
      const result: any = await sphere.payments.mintFungibleToken(coinId, 10000n);
      if (result.success || result.status === 'completed' || result.deliveryPending) {
        log("Mint success!");
      } else {
        log("Mint failed: " + result.error);
      }
    }

    const nametag = "splitbot_" + Math.floor(Math.random()*100000);
    log(`Registering nametag @${nametag} ...`);
    try {
      await sphere.registerNametag(nametag);
      log(`Successfully registered nametag: @${nametag}`);
    } catch(e: any) {
      log("Failed to register nametag: " + e.message);
    }

    const assets = await sphere.payments.getAssets();
    log("Current Assets: " + JSON.stringify(assets));

    res.status(200).json({ success: true, logs, mnemonic: sphere.getMnemonic(), nametag });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
}
