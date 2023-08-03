import { TRPCError } from "@trpc/server";
import _ from "lodash";
import { z } from "zod";

import { topicSchema } from "../../common/topic";
import { userSchema } from "../../common/user";
import { xprisma } from "../../db/extendedPrisma";
import { isLoggedIn } from "../auth";
import { procedure, router } from "../trpc";

export const topicRouter = router({
  findByUsernameAndTitle: procedure
    .input(
      z.object({
        username: userSchema.shape.username,
        title: topicSchema.shape.title,
      })
    )
    .query(async (opts) => {
      return await xprisma.topic.findFirst({
        where: {
          title: opts.input.title,
          creator: {
            username: opts.input.username,
          },
        },
      });
    }),

  /**
   * Return a topic with all its nodes and edges, and each user's scores.
   *
   * When we want to expose different amounts of topic data, we can rename this to be distinctive.
   */
  getData: procedure
    .input(
      z.object({
        username: userSchema.shape.username,
        title: topicSchema.shape.title,
      })
    )
    .query(async (opts) => {
      return await xprisma.topic.findFirst({
        where: {
          title: opts.input.title,
          creator: {
            username: opts.input.username,
          },
        },
        include: {
          nodes: true,
          edges: true,
          userScores: true,
        },
      });
    }),

  create: procedure
    .use(isLoggedIn)
    .input(topicSchema.pick({ title: true }))
    .mutation(async (opts) => {
      return await xprisma.topic.create({
        data: {
          title: opts.input.title,
          creatorId: opts.ctx.user.id,
        },
      });
    }),

  update: procedure
    .use(isLoggedIn)
    .input(topicSchema.pick({ id: true, title: true }))
    .mutation(async (opts) => {
      const topic = await xprisma.topic.findUniqueOrThrow({ where: { id: opts.input.id } });
      if (opts.ctx.user.id !== topic.creatorId) throw new TRPCError({ code: "FORBIDDEN" });

      return await xprisma.topic.update({
        where: { id: opts.input.id },
        data: {
          title: opts.input.title,
        },
      });
    }),

  delete: procedure
    .use(isLoggedIn)
    .input(topicSchema.pick({ id: true }))
    .mutation(async (opts) => {
      const topic = await xprisma.topic.findUniqueOrThrow({ where: { id: opts.input.id } });
      if (opts.ctx.user.id !== topic.creatorId) throw new TRPCError({ code: "FORBIDDEN" });

      await xprisma.topic.delete({ where: { id: opts.input.id } });

      return null;
    }),
});
