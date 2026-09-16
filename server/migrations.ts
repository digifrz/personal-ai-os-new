import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let isInitialized = false;

export function getAdminApp() {
  if (!isInitialized) {
    try {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      let config: any = {};
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
      
      if (getApps().length === 0) {
        initializeApp({
          projectId: config.projectId || process.env.FIREBASE_PROJECT_ID,
          storageBucket: config.storageBucket,
        });
      }
      isInitialized = true;
    } catch (err) {
      console.warn('Firebase admin initialization warning:', err);
    }
  }
  return getApps()[0] || null;
}

export function getAdminDb() {
  getAdminApp();
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    let dbId: string | undefined = undefined;
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)') {
        dbId = config.firestoreDatabaseId;
      }
    }
    const app = getAdminApp();
    return dbId && app ? getFirestore(app, dbId) : (app ? getFirestore(app) : getFirestore());
  } catch (err) {
    return getFirestore();
  }
}

export async function runAutomatedMigrations() {
  console.log('[Migration] Checking database schema migrations with Firebase Admin SDK...');
  try {
    const db = getAdminDb();
    const migrationsCol = db.collection('schema_migrations');

    // Migration V1: Default Community Channels & Categories
    const v1Doc = await migrationsCol.doc('v1_community_channels').get();
    if (!v1Doc.exists) {
      console.log('[Migration] Applying v1_community_channels migration...');
      const defaultChannels = [
        {
          name: 'General',
          slug: 'general',
          description: 'A friendly place to meet the community.',
          icon: '🌐',
          isActive: true,
          order: 1,
        },
        {
          name: 'AI & Tech',
          slug: 'ai-tech',
          description: 'Tools, ideas, and intelligent technology.',
          icon: '✦',
          isActive: true,
          order: 2,
        },
        {
          name: 'Coding',
          slug: 'coding',
          description: 'Build logs, debugging help, and programming.',
          icon: '💻',
          isActive: true,
          order: 3,
        },
        {
          name: 'Design',
          slug: 'design',
          description: 'Interfaces, visual ideas, and feedback.',
          icon: '🎨',
          isActive: true,
          order: 4,
        },
        {
          name: 'Startups',
          slug: 'startups',
          description: 'Products, experiments, and lessons learned.',
          icon: '🚀',
          isActive: true,
          order: 5,
        },
        {
          name: 'Students',
          slug: 'students',
          description: 'Study together and share learning wins.',
          icon: '🎓',
          isActive: true,
          order: 6,
        },
        {
          name: 'Study',
          slug: 'study',
          description: 'Focus sessions, revision, and accountability.',
          icon: '⏱️',
          isActive: true,
          order: 7,
        },
      ];

      const batch = db.batch();
      for (const channel of defaultChannels) {
        const channelRef = db.collection('community_channels').doc(channel.slug);
        batch.set(channelRef, {
          ...channel,
          createdAt: new Date().toISOString(),
        }, { merge: true });
      }

      await batch.commit();

      await migrationsCol.doc('v1_community_channels').set({
        version: 'v1',
        name: 'Community Channels Initialization',
        appliedAt: new Date().toISOString(),
        status: 'success',
      });
      console.log('[Migration] v1_community_channels completed.');
    }

    // Migration V2: System defaults & sample templates
    const v2Doc = await migrationsCol.doc('v2_system_templates').get();
    if (!v2Doc.exists) {
      console.log('[Migration] Applying v2_system_templates migration...');
      await db.collection('system_config').doc('templates').set({
        noteTemplates: [
          {
            id: 'meeting',
            title: 'Meeting Notes',
            body: '## Meeting Notes\n\n**Date:** [Date]\n**Attendees:** [Names]\n\n### Agenda\n- \n\n### Decisions\n- \n\n### Action Items\n- [ ] Task 1\n- [ ] Task 2',
          },
          {
            id: 'project_plan',
            title: 'Project Plan',
            body: '## Project Overview\n\n**Goal:** [Primary Objective]\n**Target Deadline:** [Date]\n\n### Key Deliverables\n1. \n2. \n\n### Risks & Dependencies\n- ',
          },
          {
            id: 'daily_reflection',
            title: 'Daily Reflection',
            body: '## Daily Reflection\n\n### What went well today?\n- \n\n### What challenged me?\n- \n\n### Tomorrow I will focus on:\n- ',
          },
        ],
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      await migrationsCol.doc('v2_system_templates').set({
        version: 'v2',
        name: 'System Note Templates',
        appliedAt: new Date().toISOString(),
        status: 'success',
      });
      console.log('[Migration] v2_system_templates completed.');
    }

    console.log('[Migration] All Firebase Admin SDK schema migrations applied successfully.');
    return { success: true, message: 'All schema migrations are up to date' };
  } catch (error: any) {
    console.error('[Migration Error]:', error);
    return { success: false, error: error?.message || String(error) };
  }
}
