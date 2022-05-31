import { AllServices, IServicePayload, ServiceName, ServicesPayloads } from './services';
import config from './utils/config';
import Agenda, { Job } from 'agenda';

export const Scheduler = {
  /**
   * Initialise (et démarre) le scheduler.
   * Doit absoluement être appelé avant n'importe quelle autre méthode.
   */
  setup: async () => {
    if (!_agenda) {
      const agenda = new Agenda({ db: { address: config.mongo.url } });
      registerServices(agenda);
      await agenda.start();
      _agenda = agenda;
    } else {
      console.error('Calling Scheduler.setup() twice is useless.');
    }
    console.info('Scheduler started and ready to work !');
  },
  /**
   * Créer un job récurrent et l'ajoute au scheduler
   * @param serviceName le service à éxécuter
   * @param payload les données à envoyer au service lors de l'execution (y compris la récurence)
   * @returns le job nouvellement créé
   */
  addJob: async <T extends ServiceName>(
    serviceName: T,
    payload: ServicesPayloads[T]
  ): Promise<Job<ServicesPayloads[T]>> => {
    const job = getAgenda().create(serviceName, payload);
    if (payload.mode === 'repeat') {
      job.repeatEvery(payload.interval);
    } else {
      job.schedule(payload.interval);
    }
    await job.save();
    return job as Job<ServicesPayloads[T]>;
  },
  /**
   * Cherche un job, ajouté dans le scheduler, par son ID + Service
   * @param serviceName le service où chercher le job
   * @param id l'id du job en question
   * @returns l'éventuel job trouvé
   */
  getJob: async <T extends ServiceName>(serviceName: T, id: string): Promise<Job<ServicesPayloads[T]> | undefined> => {
    const jobs = await getAgenda().jobs({ name: serviceName, 'data.id': id }, undefined, 1);
    if (jobs.length) {
      return jobs[0] as Job<ServicesPayloads[T]>;
    }
    return undefined;
  },
  /**
   * Indique si un job existe dans le scheduler avec cette paire serviceName + id
   * @param serviceName le service où chercher le job
   * @param id l'id du job en question
   * @returns  true si le job existe, false sinon
   */
  jobExists: async (serviceName: ServiceName, id: string): Promise<boolean> => {
    return (await Scheduler.getJob(serviceName, id)) !== undefined;
  },
  /**
   * Supprime un eventuel job qui aurrait cette paire serviceName + id
   * @param serviceName le service où chercher le job
   * @param id l'id du job en question
   * @returns  true si un job a été supprimé, false sinon
   */
  removeJob: async (serviceName: ServiceName, id: string): Promise<boolean> => {
    const job = await Scheduler.getJob(serviceName, id);
    if (job) {
      await job.remove();
      return true;
    }
    return false;
  },
  /**
   * Met a jour un job
   * (Il s'agit en fait de supprimer le job et de le recréer avec les nouvelles données)
   * @param serviceName le service à éxécuter
   * @param payload les données à envoyer au service lors de l'execution (y compris la récurence)
   * @returns le job nouvellement (re)créé
   */
  updateJob: async <T extends ServiceName>(
    serviceName: T,
    payload: ServicesPayloads[T]
  ): Promise<Job<ServicesPayloads[T]>> => {
    const job = await Scheduler.getJob(serviceName, payload.id);
    if (job) {
      await Scheduler.removeJob(serviceName, payload.id);
    }
    return (await Scheduler.addJob(serviceName, payload)) as Job<ServicesPayloads[T]>;
  },
};

let _agenda: Agenda;
const getAgenda = (): Agenda => {
  if (!_agenda) {
    throw 'Agenda not initialized. Did you called Scheduler.setup() ?';
  }
  return _agenda;
};

const registerServices = (agenda: Agenda): void => {
  for (const service of AllServices) {
    agenda.define(service.name, {}, (job: Job) => {
      return service.run(job.attrs.data as IServicePayload);
    });
  }
};
