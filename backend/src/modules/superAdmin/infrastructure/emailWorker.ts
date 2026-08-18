import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import Redis from 'ioredis';
import logger from '../../../shared/utils/logger';

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const emailWorker = new Worker('email-queue', async (job) => {
  if (job.name === 'send-workspace-invitation') {
    const { to, workspaceName, invitationLink } = job.data;

    await transporter.sendMail({
      from: '"AudioHive Admin" <admin@audiohive.com>',
      to,
      subject: `You are invited to manage ${workspaceName}`,
      html: `
        <h1>Welcome to ${workspaceName}!</h1>
        <p>Your workspace request has been approved.</p>
        <p>Click the link below to create your admin account:</p>
        <a href="${invitationLink}">Complete Registration</a>
      `,
    });
    logger.info(`[Email Worker] Invitation sent to ${to}`);
  } else if (job.name === 'send-user-invitation') {
    const { to, workspaceName, invitedName, role, invitationLink } = job.data;

    await transporter.sendMail({
      from: '"AudioHive Admin" <admin@audiohive.com>',
      to,
      subject: `You are invited to join ${workspaceName} as a ${role}`,
      html: `
        <h1>Welcome, ${invitedName}!</h1>
        <p>You have been invited to join the <strong>${workspaceName}</strong> workspace as a <strong>${role}</strong>.</p>
        <p>Click the link below to accept the invitation and create your account:</p>
        <a href="${invitationLink}">Accept Invitation</a>
      `,
    });
    logger.info(`[Email Worker] User Invitation sent to ${to} for ${workspaceName}`);
  }
}, { connection: redisConnection });

emailWorker.on('failed', (job, err) => {
  logger.error(`[Email Worker] Job failed: ${err.message}`);
});