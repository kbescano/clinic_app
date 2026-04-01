export interface Attendee {
  name: string
  service: string
  isPrimary: boolean
}

export const getEmailHtml = (
  name: string,
  date: string,
  time: string,
  type: string,
  location: string,
  attendees: Attendee[] = [],
) => {
  const titles: Record<string, string> = {
    confirmation: 'Booking Confirmed',
    '24h': 'See You Tomorrow',
    '2h': 'Session Commencing Soon',
  }

  const descriptions: Record<string, string> = {
    confirmation: 'Your clinical session has been officially secured in our registry.',
    '24h': 'This is a scheduled reminder for your upcoming appointment tomorrow.',
    '2h': 'Your practitioner is preparing for your arrival. We will see you shortly.',
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        /* Note: Most email clients block @import, so we fallback to Georgia/Serif */
        body { margin: 0; padding: 0; background-color: #ffffff; font-family: 'Georgia', serif; -webkit-font-smoothing: antialiased; }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Georgia', serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; padding: 80px 20px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px;">
              <tr>
                <td>
                  
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 60px;">
                    <tr>
                      <td width="1" style="background-color: #18181b; height: 48px;"></td>
                      <td width="20"></td>
                      <td>
                        <p style="text-transform: uppercase; letter-spacing: 0.4em; font-size: 8px; font-weight: 700; color: #a1a1aa; margin: 0 0 8px 0; font-family: sans-serif; font-style: italic;">
                          Clinical Registry • ${type}
                        </p>
                        <h1 style="font-weight: 300; font-size: 24px; color: #18181b; margin: 0; letter-spacing: -0.02em; text-transform: uppercase; line-height: 1;">
                          ${titles[type] || 'Session Update'}
                        </h1>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size: 13px; line-height: 1.8; color: #52525b; margin: 0 0 60px 0; font-style: italic;">
                    Hello ${name},<br><br>
                    ${descriptions[type] || 'Details regarding your clinical session are detailed below.'}
                  </p>

                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #f4f4f5; border-bottom: 1px solid #f4f4f5; margin-bottom: 60px;">
                    <tr>
                      <td style="padding: 30px 0; border-bottom: 1px solid #fafafa;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td width="50%" valign="top">
                              <p style="text-transform: uppercase; letter-spacing: 0.3em; font-size: 8px; font-weight: 700; color: #a1a1aa; margin: 0 0 10px 0; font-family: sans-serif; font-style: italic;">Date</p>
                              <p style="font-size: 14px; color: #18181b; margin: 0; font-weight: 300;">${date}</p>
                            </td>
                            <td width="50%" valign="top" style="padding-left: 24px; border-left: 1px solid #f4f4f5;">
                              <p style="text-transform: uppercase; letter-spacing: 0.3em; font-size: 8px; font-weight: 700; color: #a1a1aa; margin: 0 0 10px 0; font-family: sans-serif; font-style: italic;">Time Slot</p>
                              <p style="font-size: 14px; color: #18181b; margin: 0; font-weight: 300; text-transform: uppercase;">${time}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 30px 0;">
                        <p style="text-transform: uppercase; letter-spacing: 0.3em; font-size: 8px; font-weight: 700; color: #a1a1aa; margin: 0 0 10px 0; font-family: sans-serif; font-style: italic;">Facility Location</p>
                        <p style="font-size: 13px; color: #18181b; margin: 0; font-weight: 300; line-height: 1.6;">${location}</p>
                      </td>
                    </tr>
                  </table>

                  ${
                    attendees.length > 0
                      ? `
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td>
                        <p style="text-transform: uppercase; letter-spacing: 0.4em; font-size: 8px; font-weight: 700; color: #a1a1aa; margin: 0 0 24px 0; font-family: sans-serif; font-style: italic;">Patient Manifest</p>
                        
                        ${attendees
                          .map(
                            (a) => `
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                          <tr>
                            <td style="padding-bottom: 12px; border-bottom: 1px solid #fafafa;">
                              <p style="text-transform: uppercase; letter-spacing: 0.2em; font-size: 7px; font-weight: 700; color: #d4d4d8; margin: 0 0 4px 0; font-family: sans-serif;">
                                ${a.isPrimary ? 'Primary' : 'Guest'}
                              </p>
                              <p style="font-size: 16px; color: #18181b; margin: 0 0 8px 0; font-weight: 300; text-transform: uppercase;">
                                ${a.name}
                              </p>
                              <table border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                  <td style="border-left: 2px solid #18181b; padding-left: 12px;">
                                    <p style="color: #a1a1aa; font-size: 9px; font-family: sans-serif; text-transform: uppercase; letter-spacing: 0.2em; margin: 0; font-style: italic;">
                                      ${a.service}
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        `,
                          )
                          .join('')}
                      </td>
                    </tr>
                  </table>
                  `
                      : ''
                  }

                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 40px;">
                    <tr>
                      <td align="center">
                        <a href="https://clinic-app-sp.vercel.app/booking/status" style="background-color: #18181b; color: #ffffff; font-size: 9px; text-transform: uppercase; letter-spacing: 0.4em; padding: 20px 40px; text-decoration: none; display: inline-block; font-family: sans-serif; font-weight: 700;">
                          Manage Booking
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                </td>
              </tr>
            </table>
            
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 100px;">
              <tr>
                <td align="center" style="border-top: 1px solid #f4f4f5; padding-top: 40px;">
                  <p style="font-size: 8px; color: #d4d4d8; text-transform: uppercase; letter-spacing: 0.6em; font-family: sans-serif; margin-bottom: 12px;">
                    Atelier Clinic
                  </p>
                  <p style="font-size: 8px; color: #a1a1aa; letter-spacing: 0.1em; font-family: sans-serif; line-height: 1.6; text-transform: uppercase;">
                    Automated Registry Dispatch • Do Not Reply
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}
