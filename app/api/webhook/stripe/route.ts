import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { addCredits, updateSubscription } from "@/lib/db/users";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Event type: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId || session.client_reference_id;

        if (!userId) {
          console.error("[Stripe] No user ID in checkout session");
          break;
        }

        // Check if it's a subscription or one-time payment
        if (session.mode === "subscription") {
          // Handle subscription
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const priceId = subscription.items.data[0].price.id;
          
          // Map price IDs to tiers and credits
          const tierMapping: { [key: string]: { tier: string; credits: number } } = {
            [process.env.STRIPE_PRICE_STARTER || '']: { tier: 'starter', credits: 200 },
            [process.env.STRIPE_PRICE_PRO || '']: { tier: 'pro', credits: 500 },
            [process.env.STRIPE_PRICE_MASTER || '']: { tier: 'master', credits: 1200 },
          };

          const subscriptionData = tierMapping[priceId];
          if (subscriptionData) {
            await updateSubscription(
              userId,
              subscriptionData.tier,
              'active',
              new Date(subscription.current_period_end * 1000)
            );
            await addCredits(
              userId,
              subscriptionData.credits,
              'subscription',
              `${subscriptionData.tier.charAt(0).toUpperCase() + subscriptionData.tier.slice(1)} subscription credits`
            );
            console.log(`[Stripe] Subscription activated for user ${userId}: ${subscriptionData.tier}`);
          }
        } else {
          // Handle one-time payment (credit packs)
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          const priceId = lineItems.data[0]?.price?.id;

          const creditMapping: { [key: string]: number } = {
            [process.env.STRIPE_PRICE_SMALL_PACK || '']: 100,
            [process.env.STRIPE_PRICE_MEDIUM_PACK || '']: 350,
            [process.env.STRIPE_PRICE_LARGE_PACK || '']: 750,
            [process.env.STRIPE_PRICE_MEGA_PACK || '']: 1600,
          };

          const credits = creditMapping[priceId];
          if (credits) {
            await addCredits(
              userId,
              credits,
              'purchase',
              `Credit pack purchase: ${credits} credits`
            );
            console.log(`[Stripe] Credits added for user ${userId}: ${credits}`);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.error("[Stripe] No user ID in subscription update");
          break;
        }

        const priceId = subscription.items.data[0].price.id;
        const tierMapping: { [key: string]: string } = {
          [process.env.STRIPE_PRICE_STARTER || '']: 'starter',
          [process.env.STRIPE_PRICE_PRO || '']: 'pro',
          [process.env.STRIPE_PRICE_MASTER || '']: 'master',
        };

        const tier = tierMapping[priceId];
        if (tier) {
          await updateSubscription(
            userId,
            tier,
            subscription.status,
            new Date(subscription.current_period_end * 1000)
          );
          console.log(`[Stripe] Subscription updated for user ${userId}: ${tier} (${subscription.status})`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.error("[Stripe] No user ID in subscription deletion");
          break;
        }

        await updateSubscription(userId, 'free', 'canceled');
        console.log(`[Stripe] Subscription canceled for user ${userId}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        
        // This handles renewal payments
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const userId = subscription.metadata?.userId;

          if (!userId) {
            console.error("[Stripe] No user ID in invoice payment");
            break;
          }

          const priceId = subscription.items.data[0].price.id;
          const creditMapping: { [key: string]: number } = {
            [process.env.STRIPE_PRICE_STARTER || '']: 200,
            [process.env.STRIPE_PRICE_PRO || '']: 500,
            [process.env.STRIPE_PRICE_MASTER || '']: 1200,
          };

          const credits = creditMapping[priceId];
          if (credits) {
            await addCredits(
              userId,
              credits,
              'subscription',
              'Monthly subscription renewal credits'
            );
            console.log(`[Stripe] Renewal credits added for user ${userId}: ${credits}`);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const userId = subscription.metadata?.userId;

          if (userId) {
            await updateSubscription(userId, subscription.metadata?.tier || 'free', 'past_due');
            console.log(`[Stripe] Payment failed for user ${userId}`);
          }
        }
        break;
      }

      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`[Stripe Webhook Error]:`, error);
    return NextResponse.json(
      { error: `Webhook handler failed: ${error.message}` },
      { status: 500 }
    );
  }
}

