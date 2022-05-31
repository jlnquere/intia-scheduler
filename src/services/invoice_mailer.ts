import utils from '../utils/utils';
import { IService, IServicePayload } from '.';
export interface InvoiceMailerPayload extends IServicePayload {
  content: string;
}

export const InvoiceMailer: IService<InvoiceMailerPayload> = {
  run: async (payload: InvoiceMailerPayload) => {
    console.log('InvoiceMailer #' + payload.id + ' start.');

    utils.sleep(2000);
    console.log('    💌  Contenu: ' + payload.content);
  },
  name: 'invoice_mailer',
};
