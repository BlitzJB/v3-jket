import nodemailer from 'nodemailer'

export const emailConfig = {
  from: 'JKET Prime Care <joshuabharathi123@gmail.com>',
}

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'joshuabharathi123@gmail.com',
    pass: 'osyn kody shif wkcc', // App password
  },
}) 