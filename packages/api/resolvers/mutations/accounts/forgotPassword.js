import callMethod from '../../../callMethod';

export default async function forgotPassword(root, { email }, context) {
  callMethod(context, 'forgotPassword', { email });
  return {
    success: true,
  };
}
