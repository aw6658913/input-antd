import React, { forwardRef, useState } from 'react';
import { Upload, Icon, Progress, Row, Col, Popconfirm, Alert, Modal } from 'antd';
import ReactPlayer from 'react-player';
import { formatMessage } from 'umi-plugin-react/locale';

const ComUpload = forwardRef((props: any, ref: any) => {
    /**
     * props参数说明：
     * beforeUpload: 开始上传前触发事件
     * deleteFileList： 删除事件
     * fileList: 已上传文件列表
     * uploadingFile: 上传中文件
     * type: 上传类型，可选值image、video
     * maxNum: 最大上传数
     * videoProps： 接收react-player默认属性
     * uploadLoading： 是否加载状态
     * isHiddenProcess: 是否隐藏上传进度条
     * isFinishHidden: 上传完成后是否隐藏进度条
     * isOpenWindowPlayer: 是否新窗口播放视频
     * showType: 显示类型，可选值：text（显示名称，点击弹出播放视频，该类型isFinishHidden为true）、card（显示视频，点击直接播放），默认为text
     */
    const {
        beforeUpload = () => {},
        deleteFileList = () => {},
        deleteTempFile = () => {},
        fileList,
        uploadingFile,
        type,
        videoProps,
        uploadLoading,
        maxNum = 1,
        isHiddenProcess = false,
        isFinishHidden = false,
        isOpenWindowPlayer = true,
        showType = 'text'
    } = props;

    const [visible, setVisible] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');

    // 渲染上传样式
    const uploadButton = () => {
        if (type === 'image') {
            return (
                <div>
                    <Icon type={uploadLoading ? 'loading' : 'plus'} />
                    <div className="ant-upload-text" style={{ display: uploadLoading ? 'none' : 'block' }}>
                        上传图片
                    </div>
                </div>
            );
        }
        if (type === 'video') {
            return (
                <div>
                    <Icon style={{ fontSize: '40px' }} type={uploadLoading ? 'loading' : 'video-camera'} />
                    <div className="ant-upload-text" style={{ display: uploadLoading ? 'none' : 'block' }}>
                        添加视频
                    </div>
                </div>
            );
        }
        return null;
    };

    // 显示视频播放
    const showVideo = (item: any) => {
        setVisible(true);
        setVideoUrl(item.url || '');
    };

    // 隐藏视频播放
    const hideVideo = () => {
        setVisible(false);
        setVideoUrl('');
    };

    // 渲染视频显示信息
    const renderInfo = (item: any, index: number) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isOpenWindowPlayer ? (
                    // eslint-disable-next-line react/jsx-no-target-blank
                    <a href={item.url} target="_blank">
                        {item.key}
                    </a>
                ) : (
                    <a onClick={() => showVideo(item)}>{item.key}</a>
                )}
            </div>
            <Popconfirm
                title="是否确定删除"
                okText="确定"
                cancelText="取消"
                placement="left"
                onConfirm={() => deleteFileList(index)}
            >
                <Icon style={{ margin: '0 10px', color: '#666' }} type="delete" />
            </Popconfirm>
        </div>
    );

    // 渲染上传进度条
    const renderProcess = (fileValue: any, index: null | number) => {
        const { uploadProcess, uploadSize, uploadTotal, uploadRate } = fileValue;
        if (uploadProcess) {
            return (
                <div style={{ fontSize: '12px' }}>
                    <Progress percent={uploadProcess} showInfo={false} />
                    <Row style={{ lineHeight: 'initial', marginBottom: 10 }}>
                        <Col span={6}>
                            上传进度：{uploadProcess.toFixed(2)}%
                        </Col>
                        <Col span={9}>
                            已上传：
                            {uploadSize && uploadSize / (1024 * 1024) >= 1
                                ? `${(uploadSize / (1024 * 1024)).toFixed(2)} M`
                                : `${(uploadSize / 1024).toFixed(2)} KB`}
                            /
                            {uploadTotal && uploadTotal / (1024 * 1024) >= 1
                                ? `${(uploadTotal / (1024 * 1024)).toFixed(2)} M`
                                : `${(uploadTotal / 1024).toFixed(2)} KB`}
                        </Col>
                        <Col span={6}>
                           速度：
                            {uploadRate && uploadRate / (1024 * 1024) >= 1
                                ? `${(uploadRate / (1024 * 1024)).toFixed(2)} M/S`
                                : `${(uploadRate / 1024).toFixed(2)} KB/S`}
                        </Col>
                        <Col span={3}>
                            <Popconfirm
                                title="是否确定删除"
                                okText="确定"
                                cancelText="取消"
                                placement="left"
                                onConfirm={
                                    uploadProcess < 100 ? () => deleteTempFile(fileValue) : () => deleteFileList(index)
                                }
                            >
                                <Icon style={{ margin: '0 10px' }} type="delete" />
                            </Popconfirm>
                            {uploadProcess < 100 ? (
                                <Icon
                                    onClick={() => uploadingFile.changeUploadStatus({ ...uploadingFile })}
                                    type={uploadingFile.status === 1 ? 'pause' : 'caret-right'}
                                />
                            ) : null}
                        </Col>
                    </Row>
                </div>
            );
        }
        return null;
    };

    return (
        <div>
            <div style={{ display: maxNum && fileList.length >= maxNum ? 'none' : '' }}>
                <Upload
                    name="file"
                    ref={ref}
                    listType="picture-card"
                    className="avatar-uploader"
                    showUploadList={false}
                    beforeUpload={(file: any) => beforeUpload(file)}
                    customRequest={() => {}}
                >
                    {uploadButton()}
                </Upload>
            </div>
            {fileList.map((item: any, index: number) => {
                if (type === 'image') {
                    // eslint-disable-next-line react/no-array-index-key
                    return <img key={`image${index}`} src={item.url || ''} style={{ width: '100%' }} alt="" />;
                }
                if (type === 'video') {
                    return (
                        // eslint-disable-next-line react/no-array-index-key
                        <div key={new Date().getTime() + index} style={{ position: 'relative' }}>
                            {showType === 'text' ? (
                                <div style={{ marginBottom: 10 }}>
                                    <Alert message={renderInfo(item, index)} type="info" />
                                </div>
                            ) : (
                                <div>
                                    <ReactPlayer
                                        className="react-player"
                                        style={{ marginBottom: 10 }}
                                        url={item.url}
                                        width="100%"
                                        height="100%"
                                        controls
                                        {...videoProps}
                                    />
                                    {isFinishHidden ? (
                                        <Popconfirm
                                            title="是否确定删除"
                                            okText="确定"
                                            cancelText="取消"
                                            placement="left"
                                            onConfirm={() => deleteFileList(index)}
                                        >
                                            <Icon
                                                style={{
                                                    background: '#fff',
                                                    margin: '0 10px',
                                                    position: 'absolute',
                                                    top: 2,
                                                    right: 2
                                                }}
                                                type="close"
                                            />
                                        </Popconfirm>
                                    ) : (
                                        renderProcess(item, index)
                                    )}
                                </div>
                            )}
                        </div>
                    );
                }
                return null;
            })}
            {uploadingFile && uploadingFile.uploadProcess && uploadingFile.uploadProcess < 100 && !isHiddenProcess
                ? renderProcess(uploadingFile, null)
                : null}
            <Modal visible={visible} onCancel={hideVideo} footer={null}>
                <ReactPlayer
                    className="react-player"
                    url={videoUrl}
                    width="100%"
                    height="100%"
                    style={{ margin: '0 auto' }}
                    controls
                    {...videoProps}
                />
            </Modal>
        </div>
    );
});

export default ComUpload;
