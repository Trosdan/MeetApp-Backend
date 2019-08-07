import Mail from '../../lib/mail';

class SubscriptionMail {
  get key() {
    return 'SubscriptionMail';
  }

  async handle({ data }) {
    const { userSub, userOrg } = data;
    await Mail.sendMail({
      to: `${userSub.name} <${userSub.email}>`,
      subject: 'Nova inscrição',
      template: 'subscription',
      context: {
        name: userOrg.name,
        userName: userSub.name,
        userEmail: userSub.email,
      },
    });
  }
}

export default new SubscriptionMail();
