import { Router, Request, Response } from 'express';
import { requireAdminAuth } from '../auth/auth.middleware.js';
import { AdConfigRepository, ActivityLogRepository } from '../data/repository.js';
import {
  AdPlacement,
  AdProvidersConfig,
  CustomBannerConfig,
} from '../data/types.js';

export const adsPublicRouter = Router();
export const adsAdminRouter = Router();

const adRepo = new AdConfigRepository();
const activityRepo = new ActivityLogRepository();

const VALID_LOCATIONS = [
  'header',
  'homepage',
  'content',
  'blog',
  'tools',
  'sidebar',
  'footer',
  'mobile',
] as const;

const VALID_PROVIDERS = ['adsense', 'adsterra', 'custom'] as const;
const VALID_DEVICES = ['all', 'desktop', 'mobile'] as const;
const VALID_FORMATS = ['auto', 'horizontal', 'rectangle', 'banner'] as const;

/**
 * PUBLIC ENDPOINT: GET /api/ads/active
 * Unauthenticated, returns strictly sanitized public data for client ad rendering.
 * Does not expose internal notes, disabled slots, admin state, or private keys.
 */
adsPublicRouter.get('/active', async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await adRepo.getPublicActive();
    res.setHeader('Cache-Control', 'public, max-age=60'); // 1-minute browser cache
    res.json(data);
  } catch (err) {
    console.error('Failed to get public active ads:', err);
    res.status(500).json({ globalEnabled: false, providers: {}, placements: [] });
  }
});

// Admin routes: Require valid session authentication
adsAdminRouter.use(requireAdminAuth);

/**
 * GET /api/admin/ads/config
 * Retrieves full admin configuration including all slots, provider settings, and master switch.
 */
adsAdminRouter.get('/config', async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await adRepo.getAdminConfig();
    res.json(config);
  } catch (err) {
    console.error('Failed to get admin ads config:', err);
    res.status(500).json({ error: 'Failed to retrieve ads configuration' });
  }
});

/**
 * PUT /api/admin/ads/global
 * Toggles the master ad serving switch.
 */
adsAdminRouter.put('/global', async (req: Request, res: Response): Promise<void> => {
  try {
    const { globalEnabled } = req.body;
    if (typeof globalEnabled !== 'boolean') {
      res.status(400).json({ error: 'Field "globalEnabled" must be a boolean.' });
      return;
    }

    const updated = await adRepo.updateGlobalSettings(globalEnabled);
    await activityRepo.log(
      'ads_global_toggled',
      `Master ad serving ${globalEnabled ? 'ENABLED' : 'DISABLED'} across site.`,
    );

    res.json(updated);
  } catch (err) {
    console.error('Failed to toggle master ad switch:', err);
    res.status(500).json({ error: 'Failed to update master ad switch' });
  }
});

/**
 * PUT /api/admin/ads/providers
 * Updates configuration for Google AdSense, Adsterra, and Custom providers.
 * Strictly validates public identifiers and sanitizes all inputs.
 */
adsAdminRouter.put('/providers', async (req: Request, res: Response): Promise<void> => {
  try {
    const { adsense, adsterra, custom } = req.body as Partial<AdProvidersConfig>;

    const sanitizedUpdates: Partial<AdProvidersConfig> = {};

    // Validate AdSense
    if (adsense) {
      const pubId = typeof adsense.publisherId === 'string' ? adsense.publisherId.trim() : '';
      if (pubId && !/^ca-pub-\d{10,20}$/.test(pubId)) {
        res.status(400).json({
          error:
            'Invalid AdSense Publisher ID format. Must match "ca-pub-XXXXXXXXXXXXXXXX" with 10 to 20 digits.',
        });
        return;
      }

      sanitizedUpdates.adsense = {
        enabled: Boolean(adsense.enabled),
        publisherId: pubId,
        autoAdsEnabled: Boolean(adsense.autoAdsEnabled),
        notes: typeof adsense.notes === 'string' ? adsense.notes.slice(0, 500) : '',
      };
    }

    // Validate Adsterra
    if (adsterra) {
      const placementKey = typeof adsterra.placementKey === 'string' ? adsterra.placementKey.trim() : '';
      if (placementKey && !/^[a-zA-Z0-9_-]{1,60}$/.test(placementKey)) {
        res.status(400).json({
          error: 'Invalid Adsterra placement key. Must contain alphanumeric characters, hyphens, or underscores (max 60 chars).',
        });
        return;
      }

      sanitizedUpdates.adsterra = {
        enabled: Boolean(adsterra.enabled),
        placementKey,
        notes: typeof adsterra.notes === 'string' ? adsterra.notes.slice(0, 500) : '',
      };
    }

    // Validate Custom
    if (custom) {
      sanitizedUpdates.custom = {
        enabled: Boolean(custom.enabled),
        notes: typeof custom.notes === 'string' ? custom.notes.slice(0, 500) : '',
      };
    }

    const updated = await adRepo.updateProvidersConfig(sanitizedUpdates);
    await activityRepo.log(
      'ads_providers_updated',
      `Ad provider settings updated (AdSense: ${updated.adsense.enabled ? 'ON' : 'OFF'}, Adsterra: ${updated.adsterra.enabled ? 'ON' : 'OFF'}, Custom: ${updated.custom.enabled ? 'ON' : 'OFF'}).`,
    );

    res.json(updated);
  } catch (err) {
    console.error('Failed to update ad providers:', err);
    res.status(500).json({ error: 'Failed to update provider settings' });
  }
});

/**
 * PUT /api/admin/ads/slots/:id
 * Updates an individual ad placement slot.
 */
adsAdminRouter.put('/slots/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const slotId = req.params.id;
    const body = req.body;

    const updates: Partial<AdPlacement> = {};

    if (typeof body.enabled === 'boolean') {
      updates.enabled = body.enabled;
    }

    if (typeof body.name === 'string') {
      const name = body.name.trim();
      if (!name || name.length > 80) {
        res.status(400).json({ error: 'Slot name must be between 1 and 80 characters.' });
        return;
      }
      updates.name = name;
    }

    if (body.location !== undefined) {
      if (!VALID_LOCATIONS.includes(body.location)) {
        res.status(400).json({ error: `Invalid location. Must be one of: ${VALID_LOCATIONS.join(', ')}` });
        return;
      }
      updates.location = body.location;
    }

    if (body.provider !== undefined) {
      if (!VALID_PROVIDERS.includes(body.provider)) {
        res.status(400).json({ error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}` });
        return;
      }
      updates.provider = body.provider;
    }

    if (body.device !== undefined) {
      if (!VALID_DEVICES.includes(body.device)) {
        res.status(400).json({ error: `Invalid device target. Must be one of: ${VALID_DEVICES.join(', ')}` });
        return;
      }
      updates.device = body.device;
    }

    if (body.adUnitId !== undefined) {
      const adUnitId = typeof body.adUnitId === 'string' ? body.adUnitId.trim() : '';
      if (adUnitId && !/^[a-zA-Z0-9_-]{1,60}$/.test(adUnitId)) {
        res.status(400).json({ error: 'Invalid Ad Unit ID format. Must be alphanumeric (max 60 chars).' });
        return;
      }
      updates.adUnitId = adUnitId;
    }

    if (body.format !== undefined) {
      if (body.format && !VALID_FORMATS.includes(body.format)) {
        res.status(400).json({ error: `Invalid ad format. Must be one of: ${VALID_FORMATS.join(', ')}` });
        return;
      }
      updates.format = body.format || undefined;
    }

    if (body.notes !== undefined) {
      updates.notes = typeof body.notes === 'string' ? body.notes.slice(0, 500) : '';
    }

    // Validate structured custom banner if provided
    if (body.customBanner !== undefined) {
      if (body.customBanner === null) {
        updates.customBanner = undefined;
      } else if (typeof body.customBanner === 'object') {
        const cb = body.customBanner as Partial<CustomBannerConfig>;
        const imageUrl = typeof cb.imageUrl === 'string' ? cb.imageUrl.trim() : '';
        const destinationUrl = typeof cb.destinationUrl === 'string' ? cb.destinationUrl.trim() : '';
        const altText = typeof cb.altText === 'string' ? cb.altText.trim() : '';

        // Disallow dangerous URI protocols
        if (imageUrl && !imageUrl.startsWith('https://') && !imageUrl.startsWith('http://') && !imageUrl.startsWith('/uploads/')) {
          res.status(400).json({ error: 'Banner image URL must start with http://, https://, or /uploads/.' });
          return;
        }

        if (destinationUrl && !destinationUrl.startsWith('https://') && !destinationUrl.startsWith('http://')) {
          res.status(400).json({ error: 'Banner destination URL must start with http:// or https://.' });
          return;
        }

        updates.customBanner = {
          imageUrl,
          destinationUrl,
          altText: altText.slice(0, 150),
          title: typeof cb.title === 'string' ? cb.title.trim().slice(0, 150) : undefined,
          width: typeof cb.width === 'number' && cb.width > 0 ? cb.width : undefined,
          height: typeof cb.height === 'number' && cb.height > 0 ? cb.height : undefined,
        };
      }
    }

    const updated = await adRepo.updateSlot(slotId, updates);
    if (!updated) {
      res.status(404).json({ error: `Slot with ID "${slotId}" not found.` });
      return;
    }

    await activityRepo.log(
      'ads_slot_updated',
      `Updated ad slot "${updated.name}" (${slotId}): ${updated.enabled ? 'ENABLED' : 'DISABLED'}, provider: ${updated.provider}, location: ${updated.location}.`,
    );

    res.json(updated);
  } catch (err) {
    console.error('Failed to update ad slot:', err);
    res.status(500).json({ error: 'Failed to update ad slot' });
  }
});
