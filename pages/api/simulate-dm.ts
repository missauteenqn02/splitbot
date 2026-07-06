import type { NextApiRequest, NextApiResponse } from 'next';
import { Sphere } from '@unicitylabs/sphere-sdk';
import { createNodeProviders } from '@unicitylabs/sphere-sdk/impl/nodejs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const targetNametag = process.env.SPHERE_NAMETAG || '@splitbot_39074';
    
    // Create a temporary sphere instance for a "fake user"
    const providers = createNodeProviders({
      network: 'testnet',
    });
    
    // Using autoGenerate: true creates a throwaway identity
    const { sphere } = await Sphere.init({
      ...providers,
      network: 'testnet',
      autoGenerate: true,
    });
    
    const debtorNametag = `@debtor_${Math.floor(Math.random() * 1000)}`;
    const command = `/split 50 UCT ${debtorNametag} memo:"Simulated Test"`;
    
    // Send the DM
    await sphere.communications?.sendDM(targetNametag.replace('@', ''), command);
    
    // Close the temporary instance to free resources
    sphere.destroy();
    
    res.status(200).json({ success: true, message: `Sent command to ${targetNametag}: ${command}` });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
}
