import { InvoiceMailer, InvoiceMailerPayload } from './invoice_mailer';
import { InvoiceGenerator, InvoiceGeneratorPayload } from './invoice_generator';

export interface IServicePayload {
  /**
   * L'ID (qui doit être unique) du job à exécuter.
   * L'unicité de l'ID se fait en fonction du service. Pour être plus clair: chaque job doit avoir une paire "serviceName + id" unique.
   */
  id: string;
  /**
   * La programmation temporelle du job. Si mode === repeat, alors on s'attend à un format cron ("* * * * *"). Si mode === once, alors on s'attend à un format ISO 8601 ("2020-01-01T00:00:00.000Z").
   */
  interval: string;
  /**
   * Le mode de programmation du job. Soit elle se repete, soit elle est juste programmée une fois dans le temps.
   */
  mode: 'repeat' | 'once';
}

export interface IService<Payload extends IServicePayload> {
  run(payload: Omit<Payload, 'interval'>): Promise<void>;
  name: ServiceName;
}

export type ServiceName = 'invoice_generator' | 'invoice_mailer';

export const AllServices: IService<IServicePayload>[] = [InvoiceGenerator, InvoiceMailer];

export type ServicesPayloads = {
  invoice_generator: InvoiceGeneratorPayload;
  invoice_mailer: InvoiceMailerPayload;
};
