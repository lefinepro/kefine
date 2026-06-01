import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const orderId = params.id;
  const solverId = params.solverId;

  return {
    orderId,
    solverId
  };
};