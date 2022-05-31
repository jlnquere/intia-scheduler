import utils from '../utils/utils';
import { InvoiceMailer } from './invoice_mailer';
import { IService, IServicePayload } from '.';

export interface InvoiceGeneratorPayload extends IServicePayload {
  sendEmail: boolean;
}

export const InvoiceGenerator: IService<InvoiceGeneratorPayload> = {
  run: async (payload: InvoiceGeneratorPayload) => {
    console.log('InvoiceGenerator #' + payload.id + ' start.');

    // Let's simulate a real async process.
    utils.sleep(2000);
    console.log('    Tâche Génération facture : facture id:' + payload.id);

    if (payload.sendEmail) {
      await InvoiceMailer.run({ id: payload.id, content: 'Facture générée automatiquement.', mode: 'once' });
    }
  },
  name: 'invoice_generator',
};
