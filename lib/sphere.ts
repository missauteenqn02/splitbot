import { Sphere } from '@unicitylabs/sphere-sdk';
import { createNodeProviders } from '@unicitylabs/sphere-sdk/impl/nodejs';
import { createWalletApiProviders } from '@unicitylabs/sphere-sdk/impl/shared/wallet-api';

let sphereInstance: Sphere | null = null;

export async function getSphere(): Promise<Sphere> {
  if (sphereInstance) return sphereInstance;

  if (!process.env.SPHERE_MNEMONIC) {
    console.warn("SPHERE_MNEMONIC not set! Using a mock mode or failing...");
    // Just fail early or mock.
  }

  const base = createNodeProviders({
    network: 'testnet',
    oracle: { apiKey: 'sk_ddc3cfcc001e4a28ac3fad7407f99590' }, // public testnet2 key
  });

  const providers = createWalletApiProviders(base, {
    baseUrl: 'https://wallet-api.unicity.network',
    network: 'testnet2',
    deviceId: 'splitbot-vercel-instance',
  });

  const result = await Sphere.init({
    ...providers,
    network: 'testnet',
    autoGenerate: false,
    mnemonic: process.env.SPHERE_MNEMONIC,
    // By passing communications config we can enable fetching history
    // Since we are running in serverless, we might need a fixed dmSince or rely on storage.
    dmSince: 0, 
  });

  sphereInstance = result.sphere;
  return sphereInstance;
}
