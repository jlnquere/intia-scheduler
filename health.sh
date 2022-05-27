STATUSCODE=$(curl --write-out %{http_code} --silent --output /dev/null http://localhost:${SERVER_PORT}/health)
if test $STATUSCODE -ne 200; then
    exit 1
fi