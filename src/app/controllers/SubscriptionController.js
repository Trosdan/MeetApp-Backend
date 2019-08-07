import { isBefore } from 'date-fns';
import Subscription from '../models/Subscription';
import Meetup from '../models/Meetup';
import User from '../models/User';

import SubscriptionMail from '../jobs/SubscriptionMail';
import Queue from '../../lib/Queue';

class SubscriptionController {
  async store(req, res) {
    const user_id = req.userId;
    const meetup_id = req.params.id;

    /**
     * Check Meetup
     */
    const checkMeetup = await Meetup.findByPk(meetup_id);

    if (!checkMeetup) {
      return res.status(400).json({ error: 'Meetup does not exist' });
    }

    /**
     * Check User
     */

    const checkSubscription = await Subscription.findOne({
      where: { user_id, meetup_id },
    });

    if (checkSubscription) {
      return res.status(400).json({ error: 'User already registered' });
    }

    /**
     * Check Owner
     */
    if (user_id === checkMeetup.user_id) {
      return res
        .status(400)
        .json({ error: 'It is not possible to register at your own Meeting' });
    }

    /**
     * Check Date
     */
    if (isBefore(checkMeetup.date, new Date())) {
      return res
        .status(400)
        .json({ error: 'Unable to register for past Meetups' });
    }

    /**
     * Check same date
     */
    const listSubDate = await Subscription.findOne({
      where: {
        user_id,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: checkMeetup.date,
          },
        },
      ],
    });

    if (listSubDate) {
      return res
        .status(400)
        .json({ error: "Can't subscribe to two meetups at the same time" });
    }

    const subscription = await Subscription.create({
      user_id,
      meetup_id,
    });

    const userSub = await User.findByPk(user_id);
    const userOrg = await User.findByPk(checkMeetup.user_id);

    await Queue.add(SubscriptionMail.key, {
      ...userSub,
      ...userOrg,
    });

    return res.send(subscription);
  }
}

export default new SubscriptionController();
