import { Controller, Get, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Controller()
export class AppController {
  @Get()
  getHello(@Res() res: FastifyReply) {
    res.header('Content-Type', 'text/html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Meta Login</title>
</head>
<body>

  <div id="fb-root"></div>

  <!-- Facebook Login Button -->
  <div class="fb-login-button"
       data-width=""
       data-size="large"
       data-button-type="continue_with"
       data-layout="default"
       data-auto-logout-link="false"
       data-use-continue-as="true">
  </div>

  <!-- Facebook SDK -->
  <script>
    window.fbAsyncInit = function() {
      FB.init({
        appId      : '1790627488329989',
        cookie     : true,
        xfbml      : true,
        version    : 'v23.0'
      });
    };

    (function(d, s, id){
       var js, fjs = d.getElementsByTagName(s)[0];
       if (d.getElementById(id)) {return;}
       js = d.createElement(s); js.id = id;
       js.src = "https://connect.facebook.net/en_US/sdk.js";
       fjs.parentNode.insertBefore(js, fjs);
     }(document, 'script', 'facebook-jssdk'));
  </script>

</body>
</html>`);
  }
}
