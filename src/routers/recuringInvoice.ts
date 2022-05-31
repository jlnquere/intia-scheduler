import { Scheduler } from '../scheduler';

import express, { NextFunction, Request, Response } from 'express';
import { Job } from 'agenda';
import { InvoiceGeneratorPayload } from 'src/services/invoice_generator';
const router = express.Router();

const formatJob = (job: Job<InvoiceGeneratorPayload>) => {
  const jobData = job.attrs.data;
  if (!jobData) {
    throw 'Missing job data';
  }
  return {
    id: jobData.id,
    interval: jobData.interval,
    nextRun: job.attrs.nextRunAt,
    mode: jobData.mode,
    sendEmail: jobData.sendEmail,
  };
};

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const jobId = req.params.id;
  if (!jobId) {
    return res.status(400).send('Missing jobId');
  }

  const job = await Scheduler.getJob('invoice_generator', jobId);
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

  const jobExists = await Scheduler.jobExists('invoice_generator', id);
  if (jobExists) {
    return res.status(400).send('Job already exists');
  }

  const sendEmail = body.sendEmail || false;

  try {
    const job = await Scheduler.addJob('invoice_generator', { id, interval, sendEmail, mode: 'repeat' });
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

  const removed = await Scheduler.removeJob('invoice_generator', jobId);

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

  let job = await Scheduler.getJob('invoice_generator', jobId);
  let jobPayload = job?.attrs?.data;

  if (!job || !jobPayload) {
    return res.status(404).send('Job does not exist');
  }

  const interval = req.body.interval;
  if (!interval) {
    return res.status(400).send('Missing interval');
  }
  jobPayload.interval = interval;
  if (typeof req.body.sendEmail == 'boolean') {
    jobPayload.sendEmail = req.body.sendEmail;
  }

  const updatedJob = await Scheduler.updateJob('invoice_generator', jobPayload);
  const formattedJob = formatJob(updatedJob);
  return res.status(201).send(formattedJob);
});

export default router;
