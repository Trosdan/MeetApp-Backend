import Sequelize from 'sequelize';

import User from '../app/models/User';
import File from '../app/models/File';
import Meetup from '../app/models/Meetup';
import Subscription from '../app/models/Subscription';

import databaseConfig from '../config/database';

const models = [User, File, Meetup, Subscription];

class Database {
  constructor() {
    this.init();
    this.associate();
  }

  init() {
    this.connections = new Sequelize(databaseConfig);

    models.map(model => model.init(this.connections));
  }

  associate() {
    models.map(
      model => model.associate && model.associate(this.connections.models)
    );
  }
}

export default new Database();
