import * as Yup from 'yup';
import { isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import User from '../models/User';
import File from '../models/File';

class MeetupController {
  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string()
        .required()
        .min(5),
      description: Yup.string()
        .required()
        .min(10),
      location: Yup.string().required(),
      date: Yup.date().required(),
      file_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'validation fails.' });
    }

    const { title, description, location, date, file_id } = req.body;

    /**
     * Date Validation
     */
    if (isBefore(date, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    /**
     * Banner Validation
     */

    const checkBanner = await File.findByPk(file_id);
    if (!checkBanner) {
      return res.status(401).json({ error: 'Photo is not exists' });
    }

    const user_id = req.userId;

    const meetup = await Meetup.create({
      ...req.body,
      user_id,
    });

    return res.json(meetup);
  }

  async index(req, res) {
    const where = {};
    const page = req.query.page || 1;

    if (req.query.date) {
      const searchDate = parseISO(req.query.date);

      where.date = {
        [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
      };
    }

    const meetups = await Meetup.findAll({
      where,
      include: [
        User,
        { model: File, as: 'file', attributes: ['id', 'path', 'url'] },
      ],
      limit: 10,
      offset: 10 * page - 10,
    });

    return res.json(meetups);
  }

  async show(req, res) {
    const { id } = req.params;
    const meetup = await Meetup.findByPk(id, {
      include: [{ model: File, as: 'file', attributes: ['id', 'path', 'url'] }],
    });

    if (!meetup) {
      return res.status(401).json({ error: 'Meetup not exists' });
    }

    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().min(5),
      description: Yup.string().min(10),
      location: Yup.string(),
      date: Yup.date(),
      file_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'validation fails.' });
    }

    const { title, description, location, date, file_id } = req.body;

    /**
     * Check Meetup
     */
    const { id } = req.params;

    const checkMeetup = await Meetup.findByPk(id);

    if (!checkMeetup) {
      return res.status(401).json({ error: 'Meetup not exists' });
    }

    /**
     * Check owner user
     */
    if (req.userId !== checkMeetup.user_id) {
      return res.status(401).json({ error: 'No permission' });
    }

    /**
     * Date Validation
     */
    if (isBefore(date, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    /**
     * Banner Validation
     */

    const checkBanner = await File.findByPk(file_id);
    if (!checkBanner) {
      return res.status(401).json({ error: 'Photo not exists' });
    }

    const meetup = await Meetup.update({ ...req.body }, { where: { id } });

    return res.json(meetup);
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({ error: 'No permission' });
    }

    await meetup.destroy();

    return res.json();
  }
}

export default new MeetupController();
