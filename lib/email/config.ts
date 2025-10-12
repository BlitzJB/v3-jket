import nodemailer from 'nodemailer'

export const emailConfig = {
  from: process.env.EMAIL_FROM || 'JKET Prime Care <joshuabharathi123@gmail.com>',
}

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
}) 