import json
import re
from flask import Flask, request, send_file
from flask_cors import CORS, cross_origin
import config


class TestResources:
    def __init__(self) -> None:
        self.api_root = config.API_ROOT

        with open(config.HTTP_ARCHIVE) as f:
            self.data = json.load(f)

        self.resources = {}

        for entry in self.data['log']['entries']:
            path = entry['request']['url'].removeprefix(self.api_root)
            text = entry['response']['content']['text']

            self.resources[path] = text

        print(self.resources.keys())

    def getResource(self, path):
        print(path)
        return self.resources[path]


resources = TestResources()

app = Flask(__name__)
CORS(app, supports_credentials=True)


@app.route('/')
def index():
    return send_file(config.INDEX_HTML)


@app.route('/blank')
def blank():
    return "Blank page"


@app.route('/live/', defaults={'path': ''})
@app.route('/live/<path:path>')
@cross_origin(supports_credentials=True)
def get_dir(path):
    query_string = ""
    if request.query_string:
        query_string = f'?{request.query_string.decode()}'
    resource_path = f'{request.path}{query_string}'.removeprefix("/live")
    print(resource_path)
    try:
        return resources.getResource(resource_path)
    except KeyError:
        return "Not Found", 404


@app.route('/service-provider')
def service_provider():
    return '{"data":{"id":"0000"}}'


if __name__ == '__main__':
    app.run(debug=True)
