/* eslint-disable jsx-a11y/media-has-caption */
import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { message } from 'antd;
// @ts-ignore
import * as qiniu from 'qiniu-js';
import ComUpload from './ComUpload';
import { request } from './request';

const VVUpload = forwardRef((props: any, ref: any) => {
    /**
     * props参数说明：
     * fileList: 上传文件列表
     * type: 上传类型，可选值image、video
     * maxNum: 最大上传数
     * size: 可上传文件大小
     * accept: 可上传文件类型
     * isPrivate: 设置是否通过私有访问，默认私有资源
     * timeLimit： 资源访问时间限制，默认一天，以秒为单位，仅当isPrivate为true时有效
     * limitDuration: 视频限制时长，默认单位：秒
     * getTokenUrl: 获取token地址
     * getFileUrl: 获取上传后的文件地址
     */
    const {
        fileList = [],
        onChange,
        maxNum = 1,
        type = 'video',
        size,
        accept,
        isPrivate = true,
        timeLimit,
        limitDuration,
        getTokenUrl = '/api/resource/qiniu/getUploadToken',
        getFileUrl = '/api/resource/qiniu/getPrivateFiles',
        deleteFile = '/api/resource/qiniu/delete'
    } = props;

    const [uploadToken, setUploadToken] = useState('');
    const [uploadLoading, setUploadLoading] = useState(false);
    const [fileObj, setFileObj] = useState<any>(null);
    const [fileArray, setFileArray] = useState<Array<any>>(fileList);
    const [uploadingFile, setUploadingFile] = useState<any>({});
    const videoDom: any = useRef();

    // 文件空间域名
    const FILEDOMAIN = 'http://qbe4jmzon.sabkt.gdipper.com';

    // 请求上传凭证token，需要后端提供接口
    const getUploadToken = async () => {
        const response = await request(getTokenUrl, {
            method: 'GET'
        });
        if (response.code === 10000) {
            if (response.data && response.data.token) {
                return response.data.token;
            }
        }
        if (response.msg) {
            message.error(response.msg);
        }
        return '';
    };

    // 获取文件下载地址
    const getResourceUrl = async (param: any) => {
        const { fileName, expireInSeconds } = param;
        const response = await request(getFileUrl, {
            method: 'POST',
            data: {
                fileKeys: [fileName],
                expireInSeconds
            }
        });
        if (response.code === 10000) {
            if (response.data && response.data.length) {
                return response.data[0];
            }
        }
        if (response.msg) {
            message.error(response.msg);
        }
        return '';
    };

    const getVideoTime = (file: any) => {
        const url = URL.createObjectURL(file);
        videoDom.current.src = url;
        videoDom.current.oncanplaythrough = async () => {
            if (Number(limitDuration) && videoDom.current.duration <= Number(limitDuration)) {
                const tokenValue = await getUploadToken();
                setUploadToken(tokenValue);
                setFileObj(file);
            } else {
                message.error('超出限制时长');
            }
        };
    };

    // 监听上传开始前事件
    const beforeUpload = async (file: any) => {
        const fileType = file.type;
        const isLimitSize = !size || file.size / 1024 / 1024 < size;
        let isLimitType = false;
        if (!isLimitSize) {
            message.error('超出限制大小');
            return isLimitSize;
        }
        if (type === 'video') {
            isLimitType = fileType.startsWith('video');
            if (!isLimitType) {
                message.error('文件类型错误');
                return isLimitType;
            }
        }
        if (accept) {
            const currentFileType = fileType.substring(fileType.indexOf('/') + 1, fileType.length);
            isLimitType = accept.indexOf(currentFileType) > -1;
            if (!isLimitType) {
                message.error('文件类型错误');
                return isLimitType;
            }
        }
        if (limitDuration && type === 'video') {
            getVideoTime(file);
            return !isLimitType;
        }
        const tokenValue = await getUploadToken();
        setUploadToken(tokenValue);
        setFileObj(file);
        return isLimitType;
    };

    // 绑定onChange事件
    const triggerChange = (list: Array<any>) => {
        if (onChange) {
            onChange(list);
        }
    };

    const changeFileList = (list: Array<any>) => {
        triggerChange(list);
    };

    /**
     * 统一触发setFileArray入口
     * list: 即将改变的值
     */
    const comSetFileArray = (list: Array<any>) => {
        const newFileList = [...list];
        setFileArray([...newFileList]);
        changeFileList(newFileList);
    };

    // 设置已上传文件值
    const setFileValue = async (fileValue: any) => {
        const newFileValue = { ...fileValue };
        if (isPrivate) {
            const data = await getResourceUrl({ fileName: fileValue.key, expireInSeconds: timeLimit });
            newFileValue.url = data.resourceUrl;
            newFileValue.imageUrl = data.vframeUrl;
        } else {
            newFileValue.url = `${FILEDOMAIN}/${fileValue.key}`;
        }
        // 若请求url成功则设置值，失败则不设置值
        if (newFileValue.url) {
            fileArray.push({ ...newFileValue });
        }
        comSetFileArray(fileArray);
        // 清空上传进度
        setUploadingFile({});
    };

    // 图片上传
    const picUpload = async (para: any) => {
        const videoSize = (para.size / 1024 / 1024).toFixed(2);
        if (Number(videoSize) > size) {
            return;
        }
        if (type === 'image') {
            if (fileArray.length > maxNum) {
                return;
            }
        }
        setUploadLoading(true);
        const file = para;
        const key = `cp_${new Date().getTime()}${file.name}`;
        // 设置上传区域，qiniu.region.as0表示的东南亚区域
        const config = { region: qiniu.region.as0 };
        const observable = qiniu.upload(file, key, uploadToken, config);
        const fileValue: any = {
            index: fileArray.length,
            status: 0
        };
        // 上次上传大小，用来与下次上传大小比较，计算上传速度
        let preSize = 0;
        const observer = {
            // 监听上传
            next(res: any) {
                fileValue.uploadProcess = res.total.percent;
                fileValue.uploadRate = res.total.loaded - preSize;
                fileValue.uploadTotal = res.total.size;
                fileValue.uploadSize = res.total.loaded;
                preSize = res.total.loaded;
                setUploadingFile({ ...fileValue });
            },
            // 上传失败
            error() {
                message.error('上传失败');
                setUploadLoading(false);
            },
            // 上传完成
            complete(res: any) {
                if (res && res.key) {
                    fileValue.key = res.key;
                    setFileValue(fileValue);
                }
                setUploadToken('');
                setFileObj(null);
                setUploadLoading(false);
            }
        };
        // 开始/暂停上传
        let subscription: any = '';
        const changeUploadStatus = (item: any) => {
            const newFileValue = { ...item };
            if (newFileValue.status === 1) {
                newFileValue.status = 0;
                fileValue.status = 0;
                subscription.unsubscribe();
            } else {
                newFileValue.status = 1;
                fileValue.status = 1;
                subscription = observable.subscribe(observer);
            }
            setUploadingFile({ ...newFileValue });
        };
        fileValue.changeUploadStatus = changeUploadStatus;
        changeUploadStatus({ ...fileValue });
    };

    // 删除已上传文件
    const deleteFileList = async (index: number) => {
        // 兼容没有key的情况，若key存在执行删除，不存在则伪删除
        if (fileArray[index].key) {
            const response = await request(`${deleteFile}/${fileArray[index].key}`, {
                method: 'DELETE'
            });
            if (response.code === 10000) {
                if (response.msg) {
                    message.success(response.msg);
                }
                fileArray.splice(index, 1);
                comSetFileArray(fileArray);
            } else if (response.msg) {
                message.error(response.msg);
            }
        } else {
            fileArray.splice(index, 1);
            comSetFileArray(fileArray);
        }
    };

    // 删除临时文件
    const deleteTempFile = async (fileValue: any) => {
        if (fileValue.status === 1) {
            await fileValue.changeUploadStatus({ ...fileValue });
        }
        setUploadingFile({});
        setUploadToken('');
        setFileObj(null);
        setUploadLoading(false);
    };

    // 文件资源改变时触发上传
    useEffect(() => {
        if (fileObj) {
            picUpload(fileObj);
        }
    }, [fileObj]);

    // 外部fileList改变时触发
    useEffect(() => {
        setFileArray([...fileList]);
    }, [fileList]);

    return (
        <div>
            <ComUpload
                {...props}
                ref={ref}
                type={type}
                uploadLoading={uploadLoading}
                beforeUpload={beforeUpload}
                fileList={fileArray}
                uploadingFile={uploadingFile}
                deleteFileList={deleteFileList}
                deleteTempFile={deleteTempFile}
            />
            <video style={{ display: 'none' }} id="uploadVideo" ref={videoDom} />
        </div>
    );
});

export default VVUpload;
