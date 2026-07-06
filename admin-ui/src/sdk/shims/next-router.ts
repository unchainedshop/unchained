import { hostDep } from './host';

const NextRouter = hostDep('next/router');

export default NextRouter.default ?? NextRouter;

export const useRouter = NextRouter.useRouter;
export const withRouter = NextRouter.withRouter;
export const Router = NextRouter.Router;
