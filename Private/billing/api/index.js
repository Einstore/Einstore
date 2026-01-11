/** Fastify plugin placeholder for Billing private module. */
export async function register(app, { requireTeam }) {
  app.get(
    "/billing/status",
    { preHandler: requireTeam },
    async (request, reply) => reply.send({ status: "ok", module: "billing" }),
  );
}

export default register;
