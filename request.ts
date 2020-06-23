import { notification } from 'antd';
import { formatMessage } from 'umi-plugin-react/locale';
import fetch from 'isomorphic-fetch';

// 校验请求状态
const checkStatus = (response: any) => {
    if (response.status >= 200 && response.status < 300) {
        return response;
    }
    const errortext = formatMessage({ id: `component.upload.response.code${response.status}` }) || response.statusText;
    notification.error({
        message: `${formatMessage({ id: 'component.upload.request.err' })} ${response.status}`,
        description: errortext
    });
    return Promise.reject();
};

// 请求接口
export const request = (url: string, option: any) => {
    const defaultOptions = {
        credentials: 'include'
    };
    const newOptions = { ...defaultOptions, ...option };
    if (newOptions.method === 'POST' || newOptions.method === 'PUT' || newOptions.method === 'DELETE') {
        if (!(newOptions.data instanceof FormData)) {
            newOptions.headers = {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=utf-8',
                ...newOptions.headers
            };
            newOptions.body = JSON.stringify(newOptions.data);
            delete newOptions.data;
        } else {
            newOptions.headers = {
                Accept: 'application/json',
                ...newOptions.headers
            };
        }
    }
    return fetch(url, newOptions)
        .then(checkStatus)
        .then(response => {
            if (response.status === 204) {
                return response.text();
            }
            return response.json();
        });
};
