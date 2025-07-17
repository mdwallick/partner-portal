import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  login: handleLogin(req => {
    const { searchParams } = new URL(req.url);
    const screen_hint = searchParams.get('screen_hint') || undefined;
    const connection = searchParams.get('connection') || undefined;
    const login_hint = searchParams.get('login_hint') || undefined;
    const returnTo = searchParams.get('returnTo') || '/';
    const target_url = searchParams.get('target_url') || undefined;

    console.log('screen_hint', screen_hint);
    console.log('connection', connection);
    console.log('login_hint', login_hint);
    console.log('return_to', returnTo);
    console.log('target_url', target_url);

    return {
      authorizationParams: {
        screen_hint,
        connection,
        login_hint,
        target_url
      },
      returnTo
    };
  })
});
