export const handler = async (event) => {
  if (!event.Records && event.detailType === 'BookingCreated') {
    console.log('BookingCreated event received:', event.detail);
  }
  return { ok: true };
};