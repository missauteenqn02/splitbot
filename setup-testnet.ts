import { Sphere, getCoinIdBySymbol } from '@unicitylabs/sphere-sdk';
import { createNodeProviders } from '@unicitylabs/sphere-sdk/impl/nodejs';
import { createWalletApiProviders } from '@unicitylabs/sphere-sdk/impl/shared/wallet-api';

async function setup() {
  console.log("Setting up testnet wallet...");
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
    autoGenerate: true,
  });

  if (generatedMnemonic) {
    console.log("======================================");
    console.log("NEW MNEMONIC GENERATED.");
    console.log("Save this in .env.local as SPHERE_MNEMONIC:");
    console.log(generatedMnemonic);
    console.log("======================================");
  }

  const identity = sphere.identity;
  console.log("Wallet Address: ", identity?.directAddress);

  // Self mint UCT
  const coinId = getCoinIdBySymbol('UCT');
  if (coinId) {
    console.log("Minting 1000000 UCT for the bot...");
    const result = await sphere.payments.mintFungibleToken(coinId, 1000000n);
    if ((result as any).success || (result as any).status === 'completed' || (result as any).deliveryPending) {
      console.log("Mint success!");
    } else {
      console.log("Mint failed:", (result as any).error);
    }
  }

  // Register nametag
  const nametag = "splitbot_" + Math.floor(Math.random()*100000);
  console.log(`Registering nametag @${nametag} ...`);
  try {
    // Note: registerNametag might require Unicity ID registration on some chains,
    // but on testnet it usually just publishes to Nostr.
    await sphere.registerNametag(nametag);
    console.log(`Successfully registered nametag: @${nametag}`);
    console.log(`Save SPHERE_NAMETAG=@${nametag} in .env.local`);
  } catch(e: any) {
    console.log("Failed to register nametag:", e.message);
  }

  const assets = await sphere.payments.getAssets();
  console.log("Current Assets:", assets);
  
  process.exit(0);
}

setup().catch(console.error);
