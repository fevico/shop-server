// src/dns-setup.ts
import dns from 'node:dns';

dns.setServers(['1.1.1.1', '8.8.8.8']);
console.log('✅ DNS servers set to:', dns.getServers());