# social-network-college-project
run as container: 
docker build -t social-network-app .
docker run --env-file .env -p 3000:3000 social-network-app