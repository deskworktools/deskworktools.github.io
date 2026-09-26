import React from 'react';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { AdminSectionId } from './AdminSidebar';

interface SectionPlaceholderProps {
  sectionId: AdminSectionId;
  onNavigateToDashboard: () => void;
}

interface PlaceholderMeta {
  title: string;
  description: string;
  phase1Ready: string[];
  phase2Deliverables: string[];
}

const META_MAP: Partial<Record<AdminSectionId, PlaceholderMeta>> = {
  analytics: {
    title: 'Tool & Pageview Analytics Engine',
    description:
      'Privacy-focused telemetry tracking anonymous tool interactions (Resume Builder, PDF Merger, Image Converter, Citation Generator) without recording IP addresses or personal data.',
    phase1Ready: [
      'Server-side aggregation schema defined in data repository layer',
      'Non-blocking event dispatcher contract prepared',
      'Dashboard honest empty state active (zero fake analytics)',
    ],
    phase2Deliverables: [
      'Real-time anonymous beacon endpoint (/api/analytics/track)',
      'Most Used Tools chart with daily/weekly/monthly filters',
      'Export completion rate monitor',
      'Device category and browser capability breakdown',
    ],
  },
  blog: {
    title: 'Blog Content Management System (CMS)',
    description:
      'Full administrative control over articles, categories, and automated static generation into blog/posts.json and blog/<slug>.html.',
    phase1Ready: [
      'Existing blog/posts.json mapped to PostRepository',
      'Public blog styling preserved with zero disruption',
      'Server-side atomic write foundation ready',
    ],
    phase2Deliverables: [
      'Semantic rich-text visual article composer',
      'Draft, Published, and Scheduled status workflows',
      'Automated static HTML article generator matching existing design',
      'Cover image uploader with safe asset optimization',
    ],
  },
  media: {
    title: 'Media & Digital Asset Vault',
    description:
      'Centralized asset manager for blog imagery, resume assets, and site branding files with MIME-type validation and safe asset pruning.',
    phase1Ready: [
      'Public directory asset mapping established',
      'Server-side secure multipart handling foundation ready',
    ],
    phase2Deliverables: [
      'Drag-and-drop image uploader with client-side preview',
      'Automatic WebP image compression where supported',
      'Unused asset scanner with safety locks preventing deletion of in-use images',
      'One-click markdown & HTML image snippet copying',
    ],
  },
  ads: {
    title: 'Ads & Monetization Placement Control',
    description:
      'Configurable ad unit manager for Google AdSense, Adsterra, and custom networks across Header, Homepage, Content, Tools, and Mobile slots.',
    phase1Ready: [
      'Placement schema with 6 initial slots created in AdConfigRepository',
      'AdSense / Adsterra provider configuration abstraction completed',
      'Strict separation of site placement config from network reporting',
    ],
    phase2Deliverables: [
      'Visual ad unit toggles (Enable/Disable per slot and device)',
      'Safe script & snippet injector without hardcoding',
      'Ad blocker resilience checks',
      'ads.txt verification and synchronization monitor',
    ],
  },
  seo: {
    title: 'SEO & Metadata Management',
    description:
      'Global site meta controls, OpenGraph share preview generator, robots.txt management, and blog post search engine previews.',
    phase1Ready: [
      'Default site metadata schema defined in SiteConfigRepository',
      'Existing sitemap.xml and robots.txt mapped and verified',
    ],
    phase2Deliverables: [
      'Live Google Search snippet previewer',
      'Advisory content checks (missing meta descriptions, title length warnings)',
      'Automated sitemap.xml rebuild on blog publish',
      'Canonical URL enforcement tool',
    ],
  },
  health: {
    title: 'Site Health & Integrity Audit',
    description:
      'Automated non-destructive diagnostics checking HTTPS status, broken internal routes, asset availability, and mobile layout compliance.',
    phase1Ready: [
      'Protected server diagnostic route (/api/admin/system) operational',
      'HTTP status verification foundation in place',
    ],
    phase2Deliverables: [
      'Real-time PASS / WARNING / ERROR verification matrix',
      'Internal link scanner for all 8 public pages',
      'Blog metadata consistency validator',
      'Large asset detector (>1.5MB warning threshold)',
    ],
  },
  backups: {
    title: 'Data Backup & Disaster Recovery',
    description:
      'Safe JSON snapshot export of all administrative configurations, blog articles, and activity logs with confirmed restore protocols.',
    phase1Ready: [
      'Atomic file reading/writing completed in JsonStorageDriver',
      'Complete repository snapshot interface drafted',
    ],
    phase2Deliverables: [
      'One-click timestamped archive download (.json / .zip)',
      'Two-factor confirmation modal before any restore operation',
      'Pre-restore automatic rollback snapshot generation',
      'GitHub Pages static mirror bundle export tool',
    ],
  },
};

export const SectionPlaceholder: React.FC<SectionPlaceholderProps> = ({
  sectionId,
  onNavigateToDashboard,
}) => {
  const meta = META_MAP[sectionId] || {
    title: 'Module Under Staged Construction',
    description: 'This operational area is scheduled for the upcoming phase.',
    phase1Ready: ['Authentication and server routing active'],
    phase2Deliverables: ['Full interactive interface'],
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-[#111724] border border-slate-800 rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Phase 2 Scope
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            {meta.title}
          </h2>

          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            {meta.description}
          </p>

          <div className="pt-2">
            <button
              onClick={onNavigateToDashboard}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Return to Command Overview
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Two column status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phase 1 Foundations Completed */}
        <div className="bg-[#111724] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Phase 1 Prerequisites Prepared
          </h3>
          <ul className="space-y-2.5">
            {meta.phase1Ready.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Phase 2 Planned Deliverables */}
        <div className="bg-[#111724] border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Scheduled for Phase 2 Build
          </h3>
          <ul className="space-y-2.5">
            {meta.phase2Deliverables.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
