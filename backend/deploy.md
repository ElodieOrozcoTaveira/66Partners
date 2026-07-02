ssh -i ~/.ssh/hetzner_66partners deploy@167.233.152.6

Tu arriveras sur :

deploy@66partners:~$

Puis :

cd /opt/66partners
git pull
docker compose up -d --build

Et c'est tout.