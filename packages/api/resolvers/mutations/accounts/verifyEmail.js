import callMethod from '../../../callMethod';

export default async function verifyEmail(root, { token }, context) {
  return callMethod(context, 'verifyEmail', token);
}
