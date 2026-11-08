import https from 'https';

const ACCOUNT_ID = 'be5e47a3d516c941a80c980b5f879408';
const TUNNEL_ID = '3daae276-722a-425b-a193-e98b353e57c6';
const ZONE_ID = '1c4cf03e6badeec64a9ecdca412a297a';
const AUTH_EMAIL = 'leonfrolow@elotick.com';
const AUTH_KEY = '80db5b4553274aa6b9413d7e8809b5b558c5a';

function cfRequest(path, method, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudflare.com',
      port: 443,
      path: `/client/v4${path}`,
      method: method,
      headers: {
        'X-Auth-Email': AUTH_EMAIL,
        'X-Auth-Key': AUTH_KEY,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('1. Fetching current Cloudflare Tunnel configuration...');
  const tunnelRes = await cfRequest(`/accounts/${ACCOUNT_ID}/cfd_tunnel/${TUNNEL_ID}/configurations`, 'GET');
  if (!tunnelRes.success) {
    throw new Error('Failed to fetch tunnel config: ' + JSON.stringify(tunnelRes.errors));
  }

  const currentIngress = tunnelRes.result.config.ingress || [];
  console.log(`Current ingress rules count: ${currentIngress.length}`);

  // Filter out existing nextgengames entries if any
  const filteredIngress = currentIngress.filter(rule => 
    rule.hostname !== 'nextgengames.gg' && rule.hostname !== 'www.nextgengames.gg'
  );

  // Catchall 404 is always the last entry
  const catchAll = filteredIngress.find(r => !r.hostname) || { service: 'http_status:404' };
  const specificRules = filteredIngress.filter(r => r.hostname);

  // Add nextgengames.gg rules
  const newIngress = [
    { hostname: 'nextgengames.gg', service: 'http://localhost:80' },
    { hostname: 'www.nextgengames.gg', service: 'http://localhost:80' },
    ...specificRules,
    catchAll
  ];

  console.log('2. Updating Cloudflare Tunnel configuration with nextgengames.gg...');
  const updateRes = await cfRequest(`/accounts/${ACCOUNT_ID}/cfd_tunnel/${TUNNEL_ID}/configurations`, 'PUT', {
    config: {
      ingress: newIngress,
      'warp-routing': { enabled: false }
    }
  });

  if (!updateRes.success) {
    throw new Error('Failed to update tunnel config: ' + JSON.stringify(updateRes.errors));
  }
  console.log('✔ Cloudflare Tunnel updated successfully!');

  // 3. Update Cloudflare DNS Records
  console.log('3. Updating DNS Records for nextgengames.gg...');
  const dnsRes = await cfRequest(`/zones/${ZONE_ID}/dns_records`, 'GET');
  const records = dnsRes.result || [];

  const apexRecord = records.find(r => r.name === 'nextgengames.gg' && (r.type === 'A' || r.type === 'CNAME'));
  const wwwRecord = records.find(r => r.name === 'www.nextgengames.gg');

  const tunnelTarget = `${TUNNEL_ID}.cfargotunnel.com`;

  if (apexRecord) {
    if (apexRecord.type === 'A') {
      console.log(`Deleting legacy Vercel A record ${apexRecord.id} (${apexRecord.content})...`);
      await cfRequest(`/zones/${ZONE_ID}/dns_records/${apexRecord.id}`, 'DELETE');
      console.log('Creating new CNAME record for apex -> ' + tunnelTarget);
      await cfRequest(`/zones/${ZONE_ID}/dns_records`, 'POST', {
        type: 'CNAME',
        name: 'nextgengames.gg',
        content: tunnelTarget,
        proxied: true,
        ttl: 1
      });
    } else {
      console.log('Updating CNAME apex -> ' + tunnelTarget);
      await cfRequest(`/zones/${ZONE_ID}/dns_records/${apexRecord.id}`, 'PUT', {
        type: 'CNAME',
        name: 'nextgengames.gg',
        content: tunnelTarget,
        proxied: true,
        ttl: 1
      });
    }
  }

  if (wwwRecord) {
    console.log('Updating CNAME www -> ' + tunnelTarget);
    await cfRequest(`/zones/${ZONE_ID}/dns_records/${wwwRecord.id}`, 'PUT', {
      type: 'CNAME',
      name: 'www.nextgengames.gg',
      content: tunnelTarget,
      proxied: true,
      ttl: 1
    });
  }

  console.log('\n⭐⭐ ALL CLOUDFLARE TUNNEL & DNS RECORDS SUCCESSFULLY ROUTED! ⭐⭐\n');
}

run().catch(console.error);
