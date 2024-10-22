import { ModuleInput } from '@unchainedshop/mongodb';

// Delivery
import '../delivery/post.js';

// Payment
import '../payment/invoice.js';

// Warehousing
import '../warehousing/store.js';

// Pricing
import '../pricing/free-payment.js';
import '../pricing/free-delivery.js';
import '../pricing/order-items.js';
import '../pricing/order-discount.js';
import '../pricing/order-delivery.js';
import '../pricing/order-payment.js';
import '../pricing/product-catalog-price.js';
import '../pricing/product-discount.js';

// Quotations
import '../quotations/manual.js';

// Enrollments
import '../enrollments/licensed.js';

// Event Queue
import '../events/node-event-emitter.js';

// Workers
import '../worker/bulk-import.js';
import '../worker/zombie-killer.js';
import '../worker/message.js';
import '../worker/external.js';
import '../worker/http-request.js';
import '../worker/heartbeat.js';
import '../worker/email.js';
import '../worker/error-notifications.js';

// Asset Management
import '../files/gridfs/gridfs-adapter.js';
import { configureGridFSFileUploadModule } from '../files/gridfs/index.js';

const modules: Record<
  string,
  {
    configure: (params: ModuleInput<any>) => any;
  }
> = {
  gridfsFileUploads: {
    configure: configureGridFSFileUploadModule,
  },
};

export default modules;
