import axios from 'axios';
import type { PortalResolveResponse } from '../types/branding.types';
import { getPortalHost } from '../utils/portal-host.util';
import { resolveApiBaseUrl } from '../utils/api-url.util';

const publicApi = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

export const portalService = {
  resolve: async (host = getPortalHost()): Promise<PortalResolveResponse> => {
    const response = await publicApi.get<PortalResolveResponse>(
      '/public/portals/resolve',
      { params: { host } },
    );
    return response.data;
  },
};
