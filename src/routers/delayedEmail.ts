import { Scheduler } from '../scheduler';

import express, { NextFunction, Request, Response } from 'express';
import { Job } from 'agenda';
import { InvoiceMailerPayload } from '../services/invoice_mailer';
const router = express.Router();

const formatJob = (job: Job<InvoiceMailerPayload>) => {
  const jobData = job.attrs.data;
  if (!jobData) {
    throw 'Missing job data';
  }
  return {
    id: jobData.id,
    interval: jobData.interval,
    mode: jobData.mode,
    nextRun: job.attrs.nextRunAt,
    content: jobData.content,
  };
};

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const jobId = req.params.id;
  if (!jobId) {
    return res.status(400).send('Missing jobId');
  }

  const job = await Scheduler.getJob('invoice_mailer', jobId);
  if (!job) {
    return res.status(404).send('Job not found');
  }

  try {
    const formattedJob = formatJob(job);
    return res.status(200).send(formattedJob);
  } catch (e) {
    return res.status(500).send('Internal error:' + e);
  }
});

router.post('', async (req: Request, res: Response, next: NextFunction) => {
  const body = req.body;

  const id = body.id;
  if (!id) {
    return res.status(400).send('Missing id');
  }

  const interval = body.interval;
  if (!interval) {
    return res.status(400).send('Missing interval');
  }

  const jobExists = await Scheduler.jobExists('invoice_mailer', id);
  if (jobExists) {
    return res.status(400).send('Job already exists');
  }

  const content = body.content;
  if (!content || typeof content != 'string') {
    return res.status(400).send('Missing message content');
  }

  try {
    const job = await Scheduler.addJob('invoice_mailer', { id, interval, content, mode: 'once' });
    const formattedJob = formatJob(job);
    return res.status(201).send(formattedJob);
  } catch (e) {
    return res.status(500).send('Internal error:' + e);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const jobId = req.params.id;

  if (!jobId) {
    return res.status(400).send('Missing id');
  }

  const removed = await Scheduler.removeJob('invoice_mailer', jobId);

  if (!removed) {
    return res.status(404).send('Job does not exist');
  }
  return res.status(204).send();
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  let jobId = req.params.id;
  if (!jobId) {
    return res.status(400).send('Missing id');
  }

  let job = await Scheduler.getJob('invoice_mailer', jobId);
  let jobPayload = job?.attrs?.data;

  if (!job || !jobPayload) {
    return res.status(404).send('Job does not exist');
  }

  const interval = req.body.interval;
  if (!interval) {
    return res.status(400).send('Missing interval');
  }
  jobPayload.interval = interval;

  const content = req.body.content;
  if (content || typeof content != 'string') {
    jobPayload.content = content;
  }
  const updatedJob = await Scheduler.updateJob('invoice_mailer', jobPayload);
  const formattedJob = formatJob(updatedJob);
  return res.status(201).send(formattedJob);
});

export default router;
